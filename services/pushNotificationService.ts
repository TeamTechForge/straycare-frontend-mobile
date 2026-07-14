import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { API_URL } from "../constants/config.constants";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const pushNotificationService = {
  // Request notification permissions and setup push notifications
  async setupPushNotifications(): Promise<string | null> {
    try {
      // Get current permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If permission not granted, request it
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("[PUSH] Notification permissions not granted");
        return null;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.warn("[PUSH] No EAS projectId found in app.json. Skipping push token registration.");
        return null;
      }

      // Get the push token
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      console.log("[PUSH] Expo push token:", token.data);

      return token.data;
    } catch (error) {
      console.error("[PUSH] Failed to setup push notifications:", error);
      return null;
    }
  },

  // Send push token to backend
  async sendTokenToBackend(pushToken: string): Promise<boolean> {
    try {
      const authToken = await SecureStore.getItemAsync("authToken");
      if (!authToken) {
        console.warn("[PUSH] No auth token found");
        return false;
      }

      const response = await fetch(`${API_URL}/users/push-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ pushToken }),
      });

      if (response.ok) {
        console.log("[PUSH] Push token sent to backend successfully");
        await SecureStore.setItemAsync("pushToken", pushToken);
        return true;
      } else {
        console.error("[PUSH] Failed to send push token to backend:", response.status);
        return false;
      }
    } catch (error) {
      console.error("[PUSH] Error sending push token to backend:", error);
      return false;
    }
  },

  // Remove push token from backend (when user opts out)
  async removeTokenFromBackend(): Promise<boolean> {
    try {
      const authToken = await SecureStore.getItemAsync("authToken");
      if (!authToken) return false;

      const response = await fetch(`${API_URL}/users/push-token`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        console.log("[PUSH] Push token removed from backend successfully");
        await SecureStore.deleteItemAsync("pushToken");
        return true;
      } else {
        console.error("[PUSH] Failed to remove push token from backend:", response.status);
        return false;
      }
    } catch (error) {
      console.error("[PUSH] Error removing push token from backend:", error);
      return false;
    }
  },

  // Listen for incoming push notifications
  listenForNotifications(
    onNotification: (notification: Notifications.Notification) => void
  ): () => void {
    // Listen for notifications when app is in foreground
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[PUSH] Notification received:", notification);
      onNotification(notification);
    });

    // Listen for notification taps (when user taps the notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("[PUSH] Notification tapped:", response.notification);
        onNotification(response.notification);
      }
    );

    // Return cleanup function
    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  },

  // Initialize push notifications (call this on app startup)
  async initializePushNotifications(
    onNotification?: (notification: Notifications.Notification) => void
  ): Promise<void> {
    try {
      const pushPref = await SecureStore.getItemAsync("pushEnabled");
      if (pushPref === "false") {
        console.log("[PUSH] Push notifications disabled by user preference");
        return;
      }

      // Setup and get token
      const pushToken = await this.setupPushNotifications();

      if (!pushToken) {
        console.warn("[PUSH] Could not get push token");
        return;
      }

      // Check if token already sent
      const savedToken = await SecureStore.getItemAsync("pushToken");
      if (savedToken !== pushToken) {
        // Send new token to backend
        await this.sendTokenToBackend(pushToken);
      }

      // Setup listeners if callback provided
      if (onNotification) {
        this.listenForNotifications(onNotification);
      }

      console.log("[PUSH] Push notifications initialized successfully");
    } catch (error) {
      console.error("[PUSH] Failed to initialize push notifications:", error);
    }
  },
};

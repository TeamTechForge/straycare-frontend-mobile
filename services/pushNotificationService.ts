import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { API_URL } from "../constants/config.constants";

// Check if app is running inside Expo Go (StoreClient)
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configure notification handler safely so local notification banners show alerts and sounds
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (_err) {
  // Ignore notification handler setup error in constrained environments
}

let tokenRegistrationPromise: Promise<void> | null = null;
let registeredSessionAuthToken: string | null = null;
let foregroundNotificationSubscription: Notifications.EventSubscription | null = null;
let notificationResponseSubscription: Notifications.EventSubscription | null = null;

export const CASE_UPDATE_CATEGORY_ID = "case_update";
export const VIEW_CASE_ACTION_ID = "view_case";

export type CaseNotificationData = {
  event?: "rescue_accepted" | "case_status_updated" | string;
  caseId?: string;
  rescueRequestId?: string;
  status?: string;
  animalType?: string;
  assignedRescuerName?: string;
  action?: "view_case" | string;
  type?: "info" | "success" | "warning" | "error";
};

export const pushNotificationService = {
  // Request notification permissions and setup push notifications
  async setupPushNotifications(): Promise<string | null> {
    try {
      await Notifications.setNotificationCategoryAsync(CASE_UPDATE_CATEGORY_ID, [
        {
          identifier: VIEW_CASE_ACTION_ID,
          buttonTitle: "View Case",
          options: { opensAppToForeground: true },
        },
      ]);

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("rescue-alerts", {
          name: "Rescue Alerts",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#F5A623",
          sound: "default",
          enableVibrate: true,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync("default", {
          name: "Default Notifications",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#F5A623",
          sound: "default",
          enableVibrate: true,
          showBadge: true,
        });
      }

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

      try {
        const tokenOptions = projectId ? { projectId } : undefined;
        const token = await Notifications.getExpoPushTokenAsync(tokenOptions);
        console.log("[PUSH] Expo push token generated:", token.data);
        return token.data;
      } catch (tokenErr: any) {
        console.warn("[PUSH] Could not generate Expo push token:", tokenErr?.message || tokenErr);
        return null;
      }
    } catch (error) {
      console.warn("[PUSH] Push notification setup warning:", (error as any)?.message || error);
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
    if (isExpoGo) {
      return () => {};
    }

    try {
      foregroundNotificationSubscription?.remove();
      notificationResponseSubscription?.remove();

      // Listen for notifications when app is in foreground
      foregroundNotificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log("[PUSH] Notification received:", notification);
        onNotification(notification);
      });

      // Listen for notification taps (when user taps the notification)
      notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          console.log("[PUSH] Notification tapped:", response.notification);
          onNotification(response.notification);
        }
      );

      return () => {
        foregroundNotificationSubscription?.remove();
        notificationResponseSubscription?.remove();
        foregroundNotificationSubscription = null;
        notificationResponseSubscription = null;
      };
    } catch (_err) {
      return () => {};
    }
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

      await this.ensureAuthenticatedTokenRegistered();

      // Setup listeners if callback provided
      if (onNotification) {
        this.listenForNotifications(onNotification);
      }

      console.log("[PUSH] Push notifications initialized successfully");
    } catch (error) {
      console.error("[PUSH] Failed to initialize push notifications:", error);
    }
  },

  async ensureAuthenticatedTokenRegistered(): Promise<void> {
    const authToken = await SecureStore.getItemAsync("authToken");
    if (!authToken || registeredSessionAuthToken === authToken) {
      return;
    }

    // The root layout can rerender while authentication and navigation settle.
    // Share one in-flight registration so those renders cannot post the same
    // Expo token to the backend repeatedly.
    if (tokenRegistrationPromise) {
      return tokenRegistrationPromise;
    }

    tokenRegistrationPromise = (async () => {
      const pushToken = await this.setupPushNotifications();
      if (!pushToken) return;

      const registered = await this.sendTokenToBackend(pushToken);
      if (registered) {
        registeredSessionAuthToken = authToken;
      }
    })().finally(() => {
      tokenRegistrationPromise = null;
    });

    return tokenRegistrationPromise;
  },

  listenForNotificationResponses(
    onResponse: (response: Notifications.NotificationResponse) => void
  ): () => void {
    notificationResponseSubscription?.remove();
    notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("[PUSH] Notification tapped:", response.notification);
      onResponse(response);
    });
    return () => {
      notificationResponseSubscription?.remove();
      notificationResponseSubscription = null;
    };
  },

  getLastNotificationResponse(): Notifications.NotificationResponse | null {
    return Notifications.getLastNotificationResponse();
  },

  clearLastNotificationResponse(): void {
    Notifications.clearLastNotificationResponse();
  },

  // Trigger local OS banner notification fallback
  async presentLocalNotification(title: string, body: string, data?: Record<string, any>): Promise<void> {
    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("rescue-alerts", {
          name: "Rescue Alerts",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#F5A623",
          sound: "default",
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: "default",
          data: data || {},
        },
        trigger: null, // trigger immediately
      });
      console.log("[PUSH] Presented local notification:", title);
    } catch (err: any) {
      console.warn("[PUSH] Failed to present local notification:", err?.message || err);
    }
  },
};

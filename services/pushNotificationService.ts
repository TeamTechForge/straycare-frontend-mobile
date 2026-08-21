import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { API_URL } from "../constants/config.constants";

/**
 * Flag indicating whether the app is executing inside the Expo Go client app.
 */
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configure global Expo notification handler so local/push banners display alerts and play sound
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
  // Gracefully ignore handler setup errors in constrained or test environments
}

/** In-flight promise tracker to deduplicate concurrent push token backend registrations */
let tokenRegistrationPromise: Promise<void> | null = null;

/** Active session auth token associated with the registered push token */
let registeredSessionAuthToken: string | null = null;

/** Event subscription reference for foreground notification listener */
let foregroundNotificationSubscription: Notifications.EventSubscription | null = null;

/** Event subscription reference for notification tap/response listener */
let notificationResponseSubscription: Notifications.EventSubscription | null = null;

/** Category identifier for rescue case update notification actions */
export const CASE_UPDATE_CATEGORY_ID = "case_update";

/** Action identifier for opening case details from notification banner */
export const VIEW_CASE_ACTION_ID = "view_case";

/**
 * Type payload for rescue case push notifications.
 */
export type CaseNotificationData = {
  /** Event trigger type identifier */
  event?: "rescue_accepted" | "case_status_updated" | string;
  /** Unique case ID associated with the notification */
  caseId?: string;
  /** Unique rescue request ID */
  rescueRequestId?: string;
  /** Updated rescue case status string */
  status?: string;
  /** Animal classification type */
  animalType?: string;
  /** Assigned rescuer display name */
  assignedRescuerName?: string;
  /** Target UI action identifier */
  action?: "view_case" | string;
  /** Notification alert severity type */
  type?: "info" | "success" | "warning" | "error";
};

/**
 * Service singleton managing push notification setup, permissions, token synchronization
 * with backend servers, incoming event listeners, and local fallback presentations.
 */
export const pushNotificationService = {
  /**
   * Requests device notification permissions, registers notification categories/channels,
   * and generates an Expo Push Token.
   *
   * @returns Expo Push Token string or null if permission was denied or token generation failed
   */
  async setupPushNotifications(): Promise<string | null> {
    try {
      // Register notification category with actionable buttons
      await Notifications.setNotificationCategoryAsync(CASE_UPDATE_CATEGORY_ID, [
        {
          identifier: VIEW_CASE_ACTION_ID,
          buttonTitle: "View Case",
          options: { opensAppToForeground: true },
        },
      ]);

      // Configure Android high-priority notification channels
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

      // Check existing notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permission if not already granted
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("[PUSH] Notification permissions not granted");
        return null;
      }

      // Resolve EAS project ID from constants config
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

  /**
   * Registers the device's Expo push token with backend user profile.
   *
   * @param pushToken - Expo Push Token string generated from device
   * @returns True if backend push token registration succeeded
   */
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

  /**
   * Unregisters push token from backend user profile when user opts out or logs out.
   *
   * @returns True if token removal succeeded on backend
   */
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

  /**
   * Subscribes to incoming push notification events while the app is running.
   *
   * @param onNotification - Callback invoked when a notification is received or tapped
   * @returns Unsubscribe teardown function to clean up event listeners
   */
  listenForNotifications(
    onNotification: (notification: Notifications.Notification) => void
  ): () => void {
    if (isExpoGo) {
      return () => {};
    }

    try {
      foregroundNotificationSubscription?.remove();
      notificationResponseSubscription?.remove();

      // Listen for notifications received while app is in foreground
      foregroundNotificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log("[PUSH] Notification received:", notification);
        onNotification(notification);
      });

      // Listen for user tap interactions on notification banners
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

  /**
   * Initializes push notification capabilities on app startup if enabled by user preferences.
   *
   * @param onNotification - Optional callback invoked when a notification is received
   */
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

      // Setup event listeners if callback is provided
      if (onNotification) {
        this.listenForNotifications(onNotification);
      }

      console.log("[PUSH] Push notifications initialized successfully");
    } catch (error) {
      console.error("[PUSH] Failed to initialize push notifications:", error);
    }
  },

  /**
   * Ensures the current authenticated user's session has registered its Expo push token
   * with backend servers, deduplicating concurrent registration attempts across component renders.
   */
  async ensureAuthenticatedTokenRegistered(): Promise<void> {
    const authToken = await SecureStore.getItemAsync("authToken");
    if (!authToken || registeredSessionAuthToken === authToken) {
      return;
    }

    // Share single in-flight promise to prevent concurrent duplicate backend calls
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

  /**
   * Subscribes specifically to user notification interaction/tap responses.
   *
   * @param onResponse - Callback function invoked on notification response
   * @returns Unsubscribe function
   */
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

  /**
   * Retrieves the last notification response that opened or launched the app.
   */
  getLastNotificationResponse(): Notifications.NotificationResponse | null {
    return Notifications.getLastNotificationResponse();
  },

  /**
   * Clears the cached last notification response.
   */
  clearLastNotificationResponse(): void {
    Notifications.clearLastNotificationResponse();
  },

  /**
   * Schedules an immediate local OS banner notification fallback.
   *
   * @param title - Notification banner title string
   * @param body - Notification banner message body
   * @param data - Optional key-value payload attached to notification
   */
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

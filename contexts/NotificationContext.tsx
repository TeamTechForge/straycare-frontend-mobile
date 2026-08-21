import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/config.constants";
import { pushNotificationService } from "../services/pushNotificationService";

/**
 * Data contract representing an individual system or rescue notification item.
 */
export interface Notification {
  /** Unique notification ID */
  _id: string;
  /** Target user account ID */
  userId: string;
  /** Notification alert title header */
  title: string;
  /** Notification message body text */
  message: string;
  /** Alert type category */
  type: "success" | "error" | "info" | "warning";
  /** Indicates if the notification has been read by user */
  read: boolean;
  /** Optional associated rescue request ID */
  rescueRequestId?: string;
  /** Optional associated report case ID */
  caseId?: string;
  /** Optional notification event trigger code */
  event?: "rescue_accepted" | "case_status_updated" | string;
  /** Optional associated community post ID */
  postId?: string;
  /** Optional associated post comment ID */
  commentId?: string;
  /** Updated rescue status string */
  status?: string;
  /** Animal category type */
  animalType?: string;
  /** Assigned rescuer display name */
  assignedRescuerName?: string;
  /** Action identifier for UI routing */
  action?: "view_case" | string;
  /** ISO timestamp string when notification was created */
  createdAt: string;
}

/**
 * Context value interface provided by NotificationProvider.
 */
interface NotificationContextType {
  /** List of fetched notifications */
  notifications: Notification[];
  /** Total count of unread notifications */
  unreadCount: number;
  /** Appends a new notification object locally */
  addNotification: (notification: Notification) => void;
  /** Marks a single notification as read on backend and locally */
  markAsRead: (notificationId: string) => void;
  /** Marks all notifications as read on backend and locally */
  markAllAsRead: () => void;
  /** Removes a notification from local context state */
  removeNotification: (notificationId: string) => void;
  /** Clears all notifications from local context state */
  clearNotifications: () => void;
  /** Refreshes notification feed from backend API */
  fetchNotifications: () => Promise<void>;
  /** Indicates whether initial or background notification fetch is loading */
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Custom hook to access real-time notification state and context methods.
 *
 * @throws Error if invoked outside of a NotificationProvider ancestor
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

/**
 * Notification Provider Component.
 *
 * Wraps application hierarchy with real-time notification polling, state tracking,
 * read-state updates, and automated local OS banner dispatch for newly arrived alerts.
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDoneRef = useRef(false);

  /**
   * Fetches latest notifications from backend API and triggers local OS banner popups for new unread items.
   */
  const fetchNotifications = React.useCallback(async () => {
    let timeoutId: any = null;
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        return;
      }

      setLoading(true);
      const url = `${API_URL}/stray/notifications`;
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      if (controller) {
        timeoutId = setTimeout(() => controller.abort(), 10000);
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        ...(controller ? { signal: controller.signal as any } : {}),
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn("[NOTIFICATION] Fetch responded with status:", response.status);
        return;
      }

      const data = (await response.json()) as any;
      const list: Notification[] = Array.isArray(data) ? data : [];
      setNotifications(list);

      // Trigger local OS banner notification for newly arrived unread notifications
      if (initialFetchDoneRef.current) {
        list.forEach((notif) => {
          if (!notif.read && notif._id && !seenNotificationIdsRef.current.has(notif._id)) {
            void pushNotificationService.presentLocalNotification(notif.title, notif.message, {
              caseId: notif.caseId,
              rescueRequestId: notif.rescueRequestId,
              event: notif.event,
            });
          }
        });
      } else {
        initialFetchDoneRef.current = true;
      }

      // Mark all current IDs as seen in ref
      list.forEach((notif) => {
        if (notif._id) seenNotificationIdsRef.current.add(notif._id);
      });
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);
      if (error?.name !== "AbortError") {
        console.warn("[NOTIFICATION] Fetch error:", error?.message || error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /** Appends a notification item locally to the state array */
  const addNotification = React.useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  }, []);

  /** Marks a single notification as read on backend and updates local state */
  const markAsRead = async (notificationId: string) => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) return;

      const response = await fetch(
        `${API_URL}/stray/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.warn("[NOTIFICATION] Failed to mark notification as read:", error);
    }
  };

  /** Removes a single notification from local state array */
  const removeNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
  };

  /** Optimistically marks all notifications as read locally and sends batch read requests to backend */
  const markAllAsRead = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) return;

      const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id);
      if (unreadIds.length === 0) return;

      // Optimistically update UI
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );

      // Submit read status updates to backend for each unread notification
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`${API_URL}/stray/notifications/${id}/read`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
        )
      );
    } catch (error) {
      console.warn("[NOTIFICATION] Failed to mark all as read:", error);
    }
  };

  /** Resets local notifications state array to empty */
  const clearNotifications = () => {
    setNotifications([]);
  };

  /** Calculated total count of unread notifications */
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Poll for background notification updates every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearNotifications,
        fetchNotifications,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

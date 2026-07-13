import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../constants/config.constants";

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  fetchNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

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

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from backend
  const fetchNotifications = React.useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        console.log("[NOTIFICATION] No auth token found");
        return;
      }

      setLoading(true);
      const url = `${API_URL}/stray/notifications`;
      console.log("[NOTIFICATION] Fetching from:", url);
      console.log("[NOTIFICATION] Token:", token.substring(0, 20) + "...");

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[NOTIFICATION] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[NOTIFICATION] Failed to fetch:", response.status, errorText);
        return;
      }

      const data = await response.json();
      console.log("[NOTIFICATION] Received", data.length || 0, "notifications");
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("[NOTIFICATION] Error fetching notifications:", error.message || error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Add local notification
  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  // Mark notification as read
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

  // Remove notification locally
  const removeNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Auto-refresh notifications every 3 seconds for real-time updates
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

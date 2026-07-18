import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNotification, Notification } from "../../contexts/NotificationContext";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../../constants/config.constants";
import { useRouter } from "expo-router";

export default function NotificationCenter() {
  const router = useRouter();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, loading } =
    useNotification();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchNotifications().then(() => {
      markAllAsRead();
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "#4CAF50";
      case "error":
        return "#f44336";
      case "warning":
        return "#ff9800";
      case "info":
        return "#2196F3";
      default:
        return "#757575";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < 1) {
      const diffHours = diffTime / (1000 * 60 * 60);
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes}m ago`;
      }
      return `${Math.floor(diffHours)}h ago`;
    }
    if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`;
    }
    return date.toLocaleDateString();
  };

  const handlePressNotification = async (item: Notification) => {
    // Mark as read
    await markAsRead(item._id);

    // If this is a rescue request notification, show accept/reject actions
    if (item.title === "New Rescue Request" && item.rescueRequestId) {
      Alert.alert(
        "New Rescue Request",
        item.message,
        [
          {
            text: "Reject Request",
            style: "destructive",
            onPress: async () => {
              try {
                const token = await SecureStore.getItemAsync("authToken");
                if (!token) return;

                const response = await fetch(`${API_URL}/rescue/request/${item.rescueRequestId}/respond`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ action: "reject" }),
                });

                if (response.ok) {
                  Alert.alert("Rejected", "You rejected the rescue request.");
                  void fetchNotifications();
                } else {
                  console.error("[NotificationCenter] Reject request failed:", response.status);
                }
              } catch (err) {
                console.error("[NotificationCenter] Error rejecting request:", err);
              }
            }
          },
          {
            text: "Accept Request",
            onPress: async () => {
              try {
                const token = await SecureStore.getItemAsync("authToken");
                if (!token) return;

                const response = await fetch(`${API_URL}/rescue/request/${item.rescueRequestId}/respond`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ action: "accept" }),
                });

                if (response.ok) {
                  // Navigate to the rescue details screen
                  router.push({
                    pathname: "/rescue-details/[id]",
                    params: { id: item.rescueRequestId },
                  } as any);
                } else {
                  console.error("[NotificationCenter] Accept request failed:", response.status);
                  Alert.alert("Error", "This request may have expired or was responded to already.");
                }
              } catch (err) {
                console.error("[NotificationCenter] Error accepting request:", err);
              }
            }
          },
          {
            text: "View Details",
            onPress: () => {
              router.push({
                pathname: "/rescue-details/[id]",
                params: { id: item.rescueRequestId },
              } as any);
            }
          },
          {
            text: "Cancel",
            style: "cancel",
          }
        ],
        { cancelable: true }
      );
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        { borderLeftColor: getTypeColor(item.type) },
        !item.read && styles.unreadCard,
      ]}
      onPress={() => handlePressNotification(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.timestamp}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No notifications yet</Text>
        <Text style={styles.emptySubtext}>
          You'll receive updates about your case status here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        scrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 26,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    paddingTop: 15,
  },
  badge: {
    backgroundColor: "#f44336",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  listContent: {
    padding: 8,
  },
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  unreadCard: {
    backgroundColor: "#f9f9f9",
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2196F3",
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});

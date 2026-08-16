// components/chat/ConversationItem.tsx
// Single conversation row for the chat list. Shows avatar, name, last message,
// time, unread badge, and online indicator.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";

const BRAND_COLOR = "#F5A623";

type Props = {
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  profileImage?: string;
  role?: string;
  onPress: () => void;
  onLongPress?: () => void;
};

export default function ConversationItem({
  name,
  lastMessage,
  time,
  unreadCount,
  isOnline,
  profileImage,
  role,
  onPress,
  onLongPress,
}: Props) {
  const getRoleBadge = (userRole?: string) => {
    if (!userRole) return null;
    switch (userRole) {
      case "ngo":
        return { text: "NGO", color: "#3B82F6", bg: "#EFF6FF" };
      case "vet":
        return { text: "VET", color: "#10B981", bg: "#ECFDF5" };
      case "volunteer":
        return { text: "VOLUNTEER", color: "#F59E0B", bg: "#FEF3C7" };
      case "admin":
        return { text: "ADMIN", color: "#EF4444", bg: "#FEF2F2" };
      case "anonymous":
        return null;
      default:
        return { text: "USER", color: "#6B7280", bg: "#F3F4F6" };
    }
  };

  const badge = getRoleBadge(role);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      delayLongPress={350}
    >
      {/* Avatar with online indicator */}
      <View style={styles.avatarContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color="#999" />
          </View>
        )}
        {isOnline && <View style={styles.onlineDot} />}
      </View>

      {/* Message content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {badge && (
              <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.roleBadgeText, { color: badge.color }]}>
                  {badge.text}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.time, unreadCount > 0 && styles.timeUnread]}>{time}</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]} numberOfLines={1}>
            {lastMessage || "No messages yet"}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    flexShrink: 1,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  timeUnread: {
    color: BRAND_COLOR,
    fontWeight: "600",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: {
    fontSize: 13,
    color: "#777",
    flex: 1,
    marginRight: 8,
  },
  lastMessageUnread: {
    color: "#333",
    fontWeight: "500",
  },
  badge: {
    backgroundColor: BRAND_COLOR,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
});

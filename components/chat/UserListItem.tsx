import { Feather } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type UserListItemProps = {
  item: any;
  onPress: (user: any) => void;
  disabled?: boolean;
};

/**
 * Returns UI styling for a user role badge.
 */
const getRoleBadge = (role: string) => {
  switch (role) {
    case "ngo":
      return { text: "NGO/SHELTER", color: "#3B82F6", bg: "#EFF6FF" };
    case "vet":
      return { text: "VET", color: "#10B981", bg: "#ECFDF5" };
    case "volunteer":
      return { text: "VOLUNTEER", color: "#F59E0B", bg: "#FEF3C7" };
    default:
      return { text: "USER", color: "#6B7280", bg: "#F3F4F6" };
  }
};

/**
 * UserListItem
 * Reusable component to render a user row in search results or user lists.
 * Displays avatar, name, role badge, email, and action icon.
 */
export default function UserListItem({ item, onPress, disabled = false }: UserListItemProps) {
  const badge = getRoleBadge(item.role);

  // Get user initials for avatar
  const initials = item.name
    ? item.name
      .split(" ")
      .map((n: string) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "?";

  const canMessage = item.permissions?.canMessage !== false;

  return (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => onPress(item)}
      disabled={disabled}
    >
      {/* Avatar Circle */}
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.nameText} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>
              {badge.text}
            </Text>
          </View>
        </View>
        <Text style={styles.emailText} numberOfLines={1}>
          {item.email}
        </Text>
      </View>

      {/* Action Icon */}
      {canMessage ? (
        <Feather name="message-square" size={18} color="#9CA3AF" />
      ) : (
        <Feather name="lock" size={18} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginRight: 8,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  emailText: {
    fontSize: 13,
    color: "#6B7280",
  },
});

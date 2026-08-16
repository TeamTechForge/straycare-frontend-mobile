import React from "react";
import { View, Text, Pressable, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { threadStyles as styles } from "../../styles/thread.styles";

export default function ThreadHeaderCard({
  title,
  likes,
  isMine,
  author,
  authorAvatar,
  createdAt,
  onDelete,
}: {
  title: string;
  likes: number;
  isMine?: boolean;
  author?: string;
  authorAvatar?: string;
  createdAt?: string;
  onDelete?: () => void;
}) {
  const authorDisplayName = isMine ? "You" : (author || "Community Member");
  const initial = authorDisplayName.charAt(0).toUpperCase() || "U";
  const dateLabel = createdAt
    ? new Date(createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <View style={styles.headerCard}>
      {/* Poster Profile Header Row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          {authorAvatar ? (
            <Image
              source={{ uri: authorAvatar }}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#E5E7EB" }}
            />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{authorDisplayName}</Text>
            {Boolean(dateLabel) && <Text style={styles.timeText}>{dateLabel.toUpperCase()}</Text>}
          </View>
        </View>

        {isMine && onDelete && (
          <Pressable
            onPress={() => {
              Alert.alert("Delete Discussion Thread", "Are you sure you want to delete this thread?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: onDelete },
              ]);
            }}
            style={{
              padding: 6,
              borderRadius: 8,
              backgroundColor: "#FEF2F2",
              borderWidth: 1,
              borderColor: "#FEE2E2",
              marginLeft: 8,
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
          </Pressable>
        )}
      </View>

      <Text style={styles.headerTitle}>{title}</Text>

      <View style={styles.headerActions}>
        <Text style={styles.headerLike}>👍 {likes}</Text>
      </View>
    </View>
  );
}

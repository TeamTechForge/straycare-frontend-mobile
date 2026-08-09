import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { threadStyles as styles } from "../../styles/thread.styles";

export default function ThreadHeaderCard({
  title,
  likes,
  isMine,
  onDelete,
}: {
  title: string;
  likes: number;
  isMine?: boolean;
  onDelete?: () => void;
}) {
  return (
    <View style={styles.headerCard}>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerActions}>
        <Text style={styles.headerLike}>👍 {likes}</Text>
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
    </View>
  );
}

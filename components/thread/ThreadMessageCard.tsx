import React from "react";
import { View, Text, Pressable, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { threadStyles as styles } from "../../styles/thread.styles";
import { ThreadMessage } from "../../types/Thread";

export default function ThreadMessageCard({
  message,
  onToggleLike,
  onDeleteComment,
  isHighlighted = false,
}: {
  message: ThreadMessage;
  onToggleLike: () => void;
  onDeleteComment?: (commentId: string) => void;
  isHighlighted?: boolean;
}) {
  const badgeStyle = message.role === "Vet" ? styles.badgeVet : styles.badgeNGO;

  return (
    <View
      style={[
        styles.msgCard,
        isHighlighted && {
          backgroundColor: "#FFF8EA",
          borderWidth: 2,
          borderColor: "#FEB94B",
          borderRadius: 14,
        },
      ]}
    >
      <View style={styles.msgTopRow}>
        <View style={styles.msgLeft}>
          {message.userAvatar ? (
            <Image source={{ uri: message.userAvatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8 }} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{message.name.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}

          <View>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{message.name}</Text>
              {Boolean(message.role) && (
                <View style={[styles.roleBadge, badgeStyle]}>
                  <Text style={styles.roleText}>{message.role}</Text>
                </View>
              )}
            </View>
            {Boolean(message.subtitle) && <Text style={styles.subText}>{message.subtitle}</Text>}
          </View>
        </View>

        <Text style={styles.timeText}>{message.time}</Text>
      </View>

      <Text style={styles.msgBody}>{message.text}</Text>

      <View style={styles.msgActionsRow}>
        <Pressable onPress={onToggleLike} style={[styles.msgLikeBtn, message.likedByMe && styles.msgLikeBtnActive]}>
          <Ionicons
            name={message.likedByMe ? "thumbs-up" : "thumbs-up-outline"}
            size={13}
            color={message.likedByMe ? "#111827" : "#4B5563"}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.msgLikeText}>{message.likes}</Text>
        </Pressable>

        {/* 🔒 Delete Comment Button — ONLY for the person who posted that comment */}
        {message.isMine && onDeleteComment && (
          <Pressable
            onPress={() => {
              Alert.alert(
                "Delete Comment",
                "Are you sure you want to delete your comment?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => onDeleteComment(message.id),
                  },
                ]
              );
            }}
            style={[styles.msgLikeBtn, { borderColor: "#FEE2E2", backgroundColor: "#FEF2F2" }]}
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

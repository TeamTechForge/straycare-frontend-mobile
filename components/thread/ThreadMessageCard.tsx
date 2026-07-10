import React from "react";
import { View, Text, Pressable } from "react-native";
import { threadStyles as styles } from "../../styles/thread.styles";
import { ThreadMessage } from "../../types/Thread";

export default function ThreadMessageCard({
  message,
  onToggleLike,
}: {
  message: ThreadMessage;
  onToggleLike: () => void;
}) {
  const badgeStyle = message.role === "Vet" ? styles.badgeVet : styles.badgeNGO;

  return (
    <View style={styles.msgCard}>
      <View style={styles.msgTopRow}>
        <View style={styles.msgLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{message.name.slice(0, 1).toUpperCase()}</Text>
          </View>

          <View>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{message.name}</Text>
              <View style={[styles.roleBadge, badgeStyle]}>
                <Text style={styles.roleText}>{message.role}</Text>
              </View>
            </View>
            <Text style={styles.subText}>{message.subtitle}</Text>
          </View>
        </View>

        <Text style={styles.timeText}>{message.time}</Text>
      </View>

      <Text style={styles.msgBody}>{message.text}</Text>

      <View style={styles.msgActionsRow}>
        <Pressable onPress={onToggleLike} style={[styles.msgLikeBtn, message.likedByMe && styles.msgLikeBtnActive]}>
          <Text style={styles.msgLikeText}>👍 {message.likes}</Text>
        </Pressable>
      </View>
    </View>
  );
}

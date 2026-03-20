import React from "react";
import { View, Text, Pressable } from "react-native";
import { threadStyles as styles } from "../../styles/thread.styles";
import { ThreadMessage } from "../../types/thread";

// single message card
export default function ThreadMessageCard({
  message,
  onToggleLike,
}: {
  message: ThreadMessage;
  onToggleLike: () => void;
}) {

  // choose badge color based on role
  const badgeStyle =
    message.role === "Vet" ? styles.badgeVet : styles.badgeNGO;

  return (
    <View style={styles.msgCard}>
      
      {/* top row (avatar + name + time) */}
      <View style={styles.msgTopRow}>
        <View style={styles.msgLeft}>
          
          {/* avatar circle with first letter */}
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {message.name.slice(0, 1).toUpperCase()}
            </Text>
          </View>

          <View>
            {/* name and role */}
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{message.name}</Text>

              <View style={[styles.roleBadge, badgeStyle]}>
                <Text style={styles.roleText}>{message.role}</Text>
              </View>
            </View>

            {/* small subtitle */}
            <Text style={styles.subText}>{message.subtitle}</Text>
          </View>
        </View>

        {/* message time */}
        <Text style={styles.timeText}>{message.time}</Text>
      </View>

      {/* message text */}
      <Text style={styles.msgBody}>{message.text}</Text>

      {/* like button */}
      <View style={styles.msgActionsRow}>
        <Pressable
          onPress={onToggleLike}
          style={[
            styles.msgLikeBtn,
            message.likedByMe && styles.msgLikeBtnActive,
          ]}
        >
          <Text style={styles.msgLikeText}>👍 {message.likes}</Text>
        </Pressable>
      </View>
    </View>
  );
}

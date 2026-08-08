import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { forumStyles as styles } from "../../styles/forum.styles";
import type { ForumPost } from "../../types/Forum";

import { Ionicons } from "@expo/vector-icons";
import { Alert } from "react-native";

type Props = {
  post: ForumPost;
  onToggleLike: () => void;
  onDeletePost?: (postId: string) => void;
};

/**
 * Premium post card with tag badge, avatar, divider, and action row.
 * Elevated white card with consistent design tokens.
 */
export default function ForumPostCard({ post, onToggleLike, onDeletePost }: Props) {
  const router = useRouter();

  /* ── Author display name ────────────────────────────────────────── */
  const authorDisplayName = post.isMine ? "You" : (post.author || "User");
  const initial = authorDisplayName.charAt(0).toUpperCase() || "?";

  /* ── Relative time (simple) ────────────────────────────────────── */
  const timeAgo = post.createdAt ? getRelativeTime(post.createdAt) : "";

  return (
    <View style={styles.postCard}>
      {/* Title */}
      <Text style={styles.postTitle}>{post.title}</Text>

      {/* Post Image */}
      {post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          style={{ width: "100%", height: 180, borderRadius: 12, marginTop: 8, marginBottom: 8 }}
          resizeMode="cover"
        />
      ) : null}

      {/* Author row */}
      <View style={styles.authorRow}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.authorName}>{authorDisplayName}</Text>
        {timeAgo ? <Text style={styles.timeText}>• {timeAgo}</Text> : null}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.actionsRow}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {/* Like button */}
          <Pressable
            onPress={onToggleLike}
            style={[styles.actionBtn, post.likedByMe && styles.actionBtnLiked]}
          >
            <Text style={styles.actionIcon}>
              {post.likedByMe ? "♥" : "♡"}
            </Text>
            <Text
              style={[
                styles.actionText,
                post.likedByMe && styles.actionTextLiked,
              ]}
            >
              {post.likes}
            </Text>
          </Pressable>

          {/* Comment / go to thread */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/discussion-thread/[id]",
                params: { id: post.id },
              })
            }
            style={styles.actionBtn}
          >
            <Ionicons name="chatbubble-outline" size={14} color="#333" />
            <Text style={styles.actionText}>{post.commentCount}</Text>
          </Pressable>
        </View>

        {/* Delete Button (Only for Author) */}
        {post.isMine && onDeletePost && (
          <Pressable
            onPress={() => {
              Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => onDeletePost(post.id) },
              ]);
            }}
            style={[styles.actionBtn, { borderColor: "#FEE2E2", backgroundColor: "#FEF2F2" }]}
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/* ── Helper: simple relative time formatter ──────────────────────────── */
function getRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  } catch {
    return "";
  }
}

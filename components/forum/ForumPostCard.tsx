import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { forumStyles as styles } from "../../styles/forum.styles";
import type { ForumPost } from "../../types/Forum";

type Props = {
  post: ForumPost;
  onToggleLike: () => void;
};

/**
 * Premium post card with tag badge, avatar, divider, and action row.
 * Elevated white card with consistent design tokens.
 */
export default function ForumPostCard({ post, onToggleLike }: Props) {
  const router = useRouter();

  /* ── Tag styling based on type ─────────────────────────────────── */
  const isHealth = post.tag === "HEALTH";
  const tagBadgeStyle = isHealth ? styles.tagBadgeHealth : styles.tagBadgeGeneral;
  const tagTextStyle = isHealth ? styles.tagTextHealth : styles.tagTextGeneral;
  const tagLabel = isHealth ? "HEALTH" : "GENERAL";

  /* ── Author initial for avatar ─────────────────────────────────── */
  const initial = post.author?.charAt(0)?.toUpperCase() ?? "?";

  /* ── Relative time (simple) ────────────────────────────────────── */
  const timeAgo = post.createdAt ? getRelativeTime(post.createdAt) : "";

  return (
    <View style={styles.postCard}>
      {/* Tag badge */}
      <View style={[styles.tagBadge, tagBadgeStyle]}>
        <Text style={[styles.tagText, tagTextStyle]}>{tagLabel}</Text>
      </View>

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
        <Text style={styles.authorName}>{post.author}</Text>
        {timeAgo ? <Text style={styles.timeText}>• {timeAgo}</Text> : null}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.actionsRow}>
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
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </Pressable>
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

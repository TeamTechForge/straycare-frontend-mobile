import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { forumStyles as styles } from "../../styles/forum.styles";

export type ForumPost = {
  id: string;
  title: string;
  tag: "GENERAL" | "HEALTH";
  time: string;
  author: string;
  likes: number;
  likedByMe: boolean;
  comments: string[];
};

type Props = {
  post: ForumPost;
  onToggleLike: () => void;
  onAddComment?: (text: string) => void; // ✅ added (optional)
};

export default function ForumPostCard({ post, onToggleLike }: Props) {
  const router = useRouter();

  return (
    <View style={styles.postCard}>
      <Text style={styles.postTitle}>{post.title}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{post.author}</Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>{post.comments.length} comments</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable onPress={onToggleLike} style={styles.actionBtn}>
          <Text style={styles.actionText}>
            {post.likedByMe ? "♥" : "♡"} {post.likes}
          </Text>
        </Pressable>

        {/* ✅ GO TO THREAD SCREEN */}
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/discussion-thread/[id]",
              params: { id: post.id },
            })
          }
          style={styles.actionBtn}
        >
          <Text style={styles.actionText}>💬 Comment</Text>
        </Pressable>
      </View>
    </View>
  );
}

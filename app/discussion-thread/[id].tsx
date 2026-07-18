import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Image, RefreshControl, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { getAllPosts, addComment, getThread } from "../../services/forum.service";
import type { ForumPost, ForumThreadComment } from "../../types/Forum";
import type { ThreadData, ThreadMessage } from "../../types/Thread";
import { threadStyles as styles } from "../../styles/thread.styles";

import ThreadHeaderCard from "../../components/thread/ThreadHeaderCard";
import ThreadMessageCard from "../../components/thread/ThreadMessageCard";
import ThreadComposer from "../../components/thread/ThreadComposer";
import ThreadBottomBar from "../../components/thread/ThreadBottomBar";

const mapCommentToMessage = (comment: ForumThreadComment): ThreadMessage => {
  const createdAt = comment.timestamp ? new Date(comment.timestamp) : new Date();
  const timeLabel = Number.isNaN(createdAt.getTime())
    ? "JUST NOW"
    : createdAt.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return {
    id: comment.id,
    name: comment.userId === "forum-guest" ? "You" : comment.userId,
    role: "NGO",
    subtitle: "Forum member",
    time: timeLabel.toUpperCase(),
    text: comment.text,
    likes: 0,
    likedByMe: false,
  };
};

export default function DiscussionThreadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [thread, setThread] = useState<ThreadData>({ id: id ?? "", title: "Loading...", likes: 0, messages: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThread = useCallback(async () => {
    if (!id) {
      setError("Missing thread id");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      console.log("[DiscussionThread] Loading thread", id);
      const [posts, threadData] = await Promise.all([getAllPosts(), getThread(id)]);
      const matchedPost = posts.find((item) => item.id === id) ?? null;

      setPost(matchedPost);
      setThread({
        id,
        title: matchedPost?.title ?? "Discussion Thread",
        likes: matchedPost?.likes ?? 0,
        messages: threadData.comments.map(mapCommentToMessage),
      });
      console.log("[DiscussionThread] Loaded comments:", threadData.comments.length);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load thread";
      console.error("[DiscussionThread] Failed to load thread", loadError);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadThread();
    }, [loadThread])
  );

  const headerTitle = useMemo(() => thread.title, [thread.title]);

  function toggleMessageLike(messageId: string) {
    setThread((prev) => ({
      ...prev,
      messages: prev.messages.map((message) => {
        if (message.id !== messageId) return message;
        const nextLiked = !message.likedByMe;
        return {
          ...message,
          likedByMe: nextLiked,
          likes: nextLiked ? message.likes + 1 : Math.max(0, message.likes - 1),
        };
      }),
    }));
  }

  async function addReply(text: string) {
    const clean = text.trim();
    if (!clean || !id) return;

    try {
      setSubmitting(true);
      console.log("[DiscussionThread] Adding comment to", id, clean);
      const updatedThread = await addComment(id, clean);
      setThread((prev) => ({
        ...prev,
        messages: updatedThread.comments.map(mapCommentToMessage),
      }));
      console.log("[DiscussionThread] Comment saved");
    } catch (commentError) {
      const message = commentError instanceof Error ? commentError.message : "Failed to add comment";
      console.error("[DiscussionThread] Comment failed", commentError);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Text style={styles.pageTitle}>Discussion Thread</Text>

        {loading ? (
          <View style={{ paddingTop: 32 }}>
            <ActivityIndicator size="large" />
          </View>
        ) : error ? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: "#B00020", marginBottom: 12 }}>{error}</Text>
            <Text
              onPress={() => {
                setRefreshing(true);
                void loadThread();
              }}
              style={{ color: "#0B5FFF", fontWeight: "600" }}
            >
              Retry
            </Text>
          </View>
        ) : (
          <>
            <ThreadHeaderCard title={headerTitle} likes={post?.likes ?? thread.likes} />

            {post?.imageUrl ? (
              <Image
                source={{ uri: post.imageUrl }}
                style={{ width: "90%", height: 200, alignSelf: "center", borderRadius: 12, marginTop: 8, marginBottom: 12 }}
                resizeMode="cover"
              />
            ) : null}

            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    void loadThread();
                  }}
                />
              }
            >
              {thread.messages.map((message) => (
                <ThreadMessageCard
                  key={message.id}
                  message={message}
                  onToggleLike={() => toggleMessageLike(message.id)}
                />
              ))}
            </ScrollView>

            <ThreadComposer
              onSend={async (text) => {
                if (submitting) return;
                await addReply(text);
              }}
            />
          </>
        )}

        <ThreadBottomBar onClose={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
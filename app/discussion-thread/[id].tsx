import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";

// DiscussionThreadScreen ([id].tsx)
//
// Displays a full discussion thread with its original post header and list of comments.
// Features:
// 1. Thread Header with title, like count, author avatar/name, and delete option (for author).
// 2. Interactive comment section with optimistic deletion & rollback on error.
// 3. Highlight and auto-scroll to a specific comment when opened via notification.
// 4. Live comment composition and submission.

import { getAllPosts, addComment, getThread, deletePost, deleteComment } from "../../services/forumService";
import type { ForumPost, ForumThreadComment } from "../../types/Forum";
import type { ThreadData, ThreadMessage } from "../../types/Thread";
import { threadStyles as styles } from "../../styles/thread.styles";

import ThreadHeaderCard from "../../components/thread/ThreadHeaderCard";
import ThreadMessageCard from "../../components/thread/ThreadMessageCard";
import ThreadComposer from "../../components/thread/ThreadComposer";
import ThreadBottomBar from "../../components/thread/ThreadBottomBar";

/**
 * Helper function to transform a backend comment object into a formatted UI message.
 * Formats timestamps (e.g. "AUG 20, 07:30 PM") and resolves author display names.
 */
const mapCommentToMessage = (comment: ForumThreadComment): ThreadMessage => {
  const createdAt = comment.timestamp ? new Date(comment.timestamp) : new Date();
  const timeLabel = Number.isNaN(createdAt.getTime())
    ? "JUST NOW"
    : createdAt.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  // If the comment belongs to the current user, show "You", otherwise display their name
  const displayName = comment.isMine
    ? "You"
    : (comment.userName || (comment.userId !== "forum-guest" && comment.userId !== "guest" ? comment.userId : "User"));

  return {
    id: comment.id,
    name: displayName,
    userAvatar: comment.userAvatar,
    role: "",
    subtitle: "",
    time: timeLabel.toUpperCase(),
    text: comment.text,
    likes: 0,
    likedByMe: false,
    isMine: comment.isMine,
  };
};

export default function DiscussionThreadScreen() {
  const router = useRouter();
  
  // URL params: id = post ID; commentId = optional targeted comment from notification
  const { id, commentId, scrollToComments } = useLocalSearchParams<{ id: string; commentId?: string; scrollToComments?: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  /* ── Screen States ─────────────────────────────────────────────────── */
  const [post, setPost] = useState<ForumPost | null>(null);
  const [thread, setThread] = useState<ThreadData>({ id: id ?? "", title: "Loading...", likes: 0, messages: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(commentId || null);

  // Briefly highlight the target comment if navigated to from a push notification
  useEffect(() => {
    if (commentId) {
      setActiveHighlightId(commentId);
      const timer = setTimeout(() => {
        setActiveHighlightId(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [commentId]);

  // Auto-scroll to the bottom of the comment list when requested
  useEffect(() => {
    if (!loading && (scrollToComments === "true" || commentId)) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [loading, scrollToComments, commentId]);

  // Load the discussion thread details and all comments from backend
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

  // Reload comments when returning to this screen
  useFocusEffect(
    useCallback(() => {
      void loadThread();
    }, [loadThread])
  );

  const headerTitle = useMemo(() => thread.title, [thread.title]);

  // Toggle local like state on a comment message
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

  // Submit a new comment to the thread
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

  // Delete the whole discussion thread (only available to post author)
  async function handleDeleteThread() {
    if (!id) return;
    try {
      setLoading(true);
      await deletePost(id);
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete thread";
      setError(message);
      setLoading(false);
    }
  }

  // Delete an individual comment with optimistic UI update and rollback on failure
  async function handleDeleteComment(targetCommentId: string) {
    if (!id) return;

    // 1. Backup previous messages for rollback in case backend fails
    const previousMessages = thread.messages;

    // 2. Optimistically remove comment from UI immediately for snappy user experience
    setThread((prev) => ({
      ...prev,
      messages: prev.messages.filter((m) => m.id !== targetCommentId),
    }));

    try {
      console.log("[DiscussionThread] Deleting comment", targetCommentId, "from thread", id);
      await deleteComment(id, targetCommentId);
      await loadThread();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete comment";
      console.error("[DiscussionThread] Delete comment failed", err);
      // 3. Rollback optimistic removal on error and alert the user
      setThread((prev) => ({ ...prev, messages: previousMessages }));
      Alert.alert("Unable to Delete Comment", message);
      void loadThread();
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
            {/* Discussion Post Header Card */}
            <ThreadHeaderCard
              title={headerTitle}
              likes={post?.likes ?? thread.likes}
              isMine={post?.isMine}
              author={post?.author}
              authorAvatar={post?.authorAvatar}
              createdAt={post?.createdAt}
              onDelete={handleDeleteThread}
            />

            {/* Attached post image if present */}
            {post?.imageUrl ? (
              <Image
                source={{ uri: post.imageUrl }}
                style={{ width: "90%", height: 200, alignSelf: "center", borderRadius: 12, marginTop: 8, marginBottom: 12 }}
                resizeMode="cover"
              />
            ) : null}

            {/* Scrollable list of comments */}
            <ScrollView
              ref={scrollViewRef}
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
                  isHighlighted={message.id === activeHighlightId || message.id === commentId}
                  onToggleLike={() => toggleMessageLike(message.id)}
                  onDeleteComment={(commentIdToDelete) => handleDeleteComment(commentIdToDelete)}
                />
              ))}
            </ScrollView>

            {/* Input Composer for adding comments */}
            <ThreadComposer
              onSend={async (text) => {
                if (submitting) return;
                await addReply(text);
              }}
            />
          </>
        )}

        {/* Bottom Back Button Bar */}
        <ThreadBottomBar onClose={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
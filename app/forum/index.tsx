import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// DiscussionForumScreen.tsx
//
// Main community discussion forum screen.
// Features:
// 1. Browse discussion posts by tabs: "Newest", "Active", and "Unanswered".
// 2. Like/unlike discussion posts with instantaneous UI feedback.
// 3. Delete own posts.
// 4. View separate sections for "My Active Threads" vs "Other Active Discussions".

import { forumStyles as styles } from "../../styles/forum.styles";
import ForumTabs from "../../components/forum/ForumTabs";
import ForumPostCard from "../../components/forum/ForumPostCard";
import ForumBottomActions from "../../components/forum/ForumBottomActions";
import { getAllPosts, likePost } from "../../services/forumService";
import type { ForumPost } from "../../types/Forum";

type TabKey = "Newest" | "Active" | "Unanswered";

export default function DiscussionForumScreen() {
  const router = useRouter();

  /* ── State ──────────────────────────────────────────────────────────── */
  // Active tab ("Newest", "Active", or "Unanswered")
  const [tab, setTab] = useState<TabKey>("Newest");
  
  // List of all discussion posts retrieved from backend
  const [posts, setPosts] = useState<ForumPost[]>([]);
  
  // Loading indicator state for initial fetch
  const [loading, setLoading] = useState(true);
  
  // Pull-to-refresh spinner state
  const [refreshing, setRefreshing] = useState(false);
  
  // Error message state
  const [error, setError] = useState<string | null>(null);
  
  // Track liked state locally for instant UI feedback
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  /* ── Data fetching ──────────────────────────────────────────────────── */
  // Fetch all discussion posts from the server
  const refreshPosts = useCallback(async () => {
    try {
      console.log("[DiscussionForum] ========== Loading posts ==========");
      setError(null);
      const data = await getAllPosts();
      console.log(
        "[DiscussionForum] Successfully loaded posts:",
        data.length,
        "posts"
      );
      // Merge server post data with local liked states
      setPosts(
        data.map((post) => ({
          ...post,
          likedByMe: likedPosts[post.id] ?? post.likedByMe ?? false,
        }))
      );
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "Failed to load posts";
      console.error("[DiscussionForum] ERROR loading posts:", message, loadError);
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [likedPosts]);

  // Refresh posts whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("[DiscussionForum] Screen focused, refreshing posts");
      void refreshPosts();
    }, [refreshPosts])
  );

  /* ── Filtered & sorted posts ────────────────────────────────────────── */
  // User's own active discussion threads sorted by most comments
  const myActivePosts = useMemo(() => {
    return posts.filter((p) => p.isMine).sort((a, b) => b.commentCount - a.commentCount);
  }, [posts]);

  // Other users' active discussion threads sorted by most comments
  const otherActivePosts = useMemo(() => {
    return posts.filter((p) => !p.isMine).sort((a, b) => b.commentCount - a.commentCount);
  }, [posts]);

  // Filter posts based on the currently selected tab
  const filtered = useMemo(() => {
    if (tab === "Newest") return posts;
    if (tab === "Active") {
      return [...posts].sort((a, b) => b.commentCount - a.commentCount);
    }
    // "Unanswered" tab shows discussions with 0 comments
    return posts.filter((post) => post.commentCount === 0);
  }, [tab, posts]);

  /* ── Like handler ───────────────────────────────────────────────────── */
  // Toggle like status for a discussion post
  async function toggleLike(id: string) {
    try {
      console.log("[DiscussionForum] Toggling like for post", id);
      const result = await likePost(id);
      setLikedPosts((prev) => ({ ...prev, [id]: result.likedByMe }));
      await refreshPosts();
      console.log("[DiscussionForum] Like updated successfully");
    } catch (likeError) {
      const message =
        likeError instanceof Error
          ? likeError.message
          : "Failed to update like";
      console.error("[DiscussionForum] ERROR toggling like:", message);
      setError(message);
    }
  }

  /* ── Delete handler ─────────────────────────────────────────────────── */
  // Delete the user's own post and remove it immediately from state
  async function handleDeletePost(id: string) {
    try {
      console.log("[DiscussionForum] Deleting post", id);
      const { deletePost } = await import("../../services/forumService");
      await deletePost(id);
      // Remove deleted post from local state
      setPosts((prev) => prev.filter((p) => p.id !== id));
      console.log("[DiscussionForum] Post deleted successfully");
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : "Failed to delete post";
      console.error("[DiscussionForum] ERROR deleting post:", message);
      setError(message);
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        {/* Screen Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Discussion Forum</Text>
          <Text style={styles.subtitle}>
            Share experiences and help others
          </Text>
        </View>

        {/* Tab Selection Bar */}
        <ForumTabs tab={tab} onChange={setTab} />

        {/* ── Loading state ─────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color="#FEB94B" />
            <Text style={[styles.stateMessage, { marginTop: 12 }]}>
              Loading posts…
            </Text>
          </View>
        ) : error ? (
          /* ── Error state with retry button ────────────────────────── */
          <View style={styles.centeredState}>
            <Ionicons name="alert-circle-outline" size={48} color="#999" />
            <Text style={styles.stateTitle}>Something went wrong</Text>
            <Text style={styles.stateMessage}>{error}</Text>
            <Pressable
              style={styles.retryBtn}
              onPress={() => {
                setRefreshing(true);
                void refreshPosts();
              }}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : posts.length === 0 ? (
          /* ── Empty state ────────────────────────────────────────── */
          <View style={styles.centeredState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#999" />
            <Text style={styles.stateTitle}>No posts yet</Text>
            <Text style={styles.stateMessage}>
              Be the first to start a discussion!
            </Text>
          </View>
        ) : (
          /* ── Post list with pull-to-refresh ──────────────────────── */
          <ScrollView
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                tintColor="#FEB94B"
                onRefresh={() => {
                  setRefreshing(true);
                  void refreshPosts();
                }}
              />
            }
          >
            {tab === "Active" ? (
              <>
                {/* Section: User's own active discussion threads */}
                <Text style={styles.sectionHeaderTitle}>My Active Threads</Text>
                {myActivePosts.length > 0 ? (
                  myActivePosts.map((post) => (
                    <ForumPostCard
                      key={post.id}
                      post={post}
                      onToggleLike={() => void toggleLike(post.id)}
                      onDeletePost={handleDeletePost}
                    />
                  ))
                ) : (
                  <Text style={styles.emptySectionText}>You have no active discussion threads yet.</Text>
                )}

                {/* Section: Other users' active discussion threads */}
                <Text style={[styles.sectionHeaderTitle, { marginTop: 14 }]}>Other Active Discussions</Text>
                {otherActivePosts.length > 0 ? (
                  otherActivePosts.map((post) => (
                    <ForumPostCard
                      key={post.id}
                      post={post}
                      onToggleLike={() => void toggleLike(post.id)}
                      onDeletePost={handleDeletePost}
                    />
                  ))
                ) : (
                  <Text style={styles.emptySectionText}>No other active discussions found.</Text>
                )}
              </>
            ) : (
              // Display filtered list for "Newest" or "Unanswered"
              filtered.map((post) => (
                <ForumPostCard
                  key={post.id}
                  post={post}
                  onToggleLike={() => void toggleLike(post.id)}
                  onDeletePost={handleDeletePost}
                />
              ))
            )}
          </ScrollView>
        )}

        {/* Bottom Actions Bar (e.g. Create Post / Back) */}
        <ForumBottomActions onClose={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
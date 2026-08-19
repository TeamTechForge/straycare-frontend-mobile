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
  const [tab, setTab] = useState<TabKey>("Newest");
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  /* ── Data fetching ──────────────────────────────────────────────────── */
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

  useFocusEffect(
    useCallback(() => {
      console.log("[DiscussionForum] Screen focused, refreshing posts");
      void refreshPosts();
    }, [refreshPosts])
  );

  /* ── Filtered & sorted posts ────────────────────────────────────────── */
  const myActivePosts = useMemo(() => {
    return posts.filter((p) => p.isMine).sort((a, b) => b.commentCount - a.commentCount);
  }, [posts]);

  const otherActivePosts = useMemo(() => {
    return posts.filter((p) => !p.isMine).sort((a, b) => b.commentCount - a.commentCount);
  }, [posts]);

  const filtered = useMemo(() => {
    if (tab === "Newest") return posts;
    if (tab === "Active") {
      return [...posts].sort((a, b) => b.commentCount - a.commentCount);
    }
    return posts.filter((post) => post.commentCount === 0);
  }, [tab, posts]);

  /* ── Like handler ───────────────────────────────────────────────────── */
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
  async function handleDeletePost(id: string) {
    try {
      console.log("[DiscussionForum] Deleting post", id);
      const { deletePost } = await import("../../services/forumService");
      await deletePost(id);
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
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Discussion Forum</Text>
          <Text style={styles.subtitle}>
            Share experiences and help others
          </Text>
        </View>

        {/* Tab Bar */}
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
          /* ── Error state ────────────────────────────────────────── */
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
          /* ── Post list ──────────────────────────────────────────── */
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
                {/* MY ACTIVE THREADS */}
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

                {/* OTHER ACTIVE DISCUSSIONS */}
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

        {/* Bottom Actions */}
        <ForumBottomActions onClose={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
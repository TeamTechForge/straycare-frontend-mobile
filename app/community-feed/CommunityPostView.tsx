// app/community-feed/CommunityPostView.tsx

import {
  Ionicons,
} from "@expo/vector-icons";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../../components/BackButton";

import {
  getCommunityPost,
  CommunityPost,
  deleteCommunityPost,
  reportCommunityPost,
  likeCommunityPost,
  unlikeCommunityPost,
  saveCommunityPost,
  unsaveCommunityPost,
  getCommunityComments,
  createCommunityComment,
  deleteCommunityComment,
  CommunityComment,
} from "../../services/communityService";
import ReportPostModal from "../../components/ReportPostModal";
import { colors } from "../../constants/colors.constants";
import { useAuth } from "../../contexts/AuthContext";
import CommunityPostDetails from "./CommunityPostDetails";

// ─────────────────────────────────────────────
// DATES
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function CommunityPostView() {
  const router = useRouter();
  const { user } = useAuth();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Likes & Saves State
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Comments & Replies State
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    username: string;
  } | null>(null);

  const inputRef = useRef<TextInput | null>(null);
  const scrollViewRef = useRef<ScrollView | null>(null);

  const handleDelete = () => {
    if (!post) return;
    Alert.alert("Delete post?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCommunityPost(post._id);
            router.replace("/community-feed/CommunityPostMain");
          } catch (deleteError: any) {
            Alert.alert(
              "Unable to delete post",
              deleteError?.response?.data?.message || "Please try again."
            );
          }
        },
      },
    ]);
  };

  // ─────────────────────────────────────────────
  // NAVIGATION TO PROFILE
  // ─────────────────────────────────────────────

  const handleAuthorPress = (authorId?: string | null) => {
    if (!authorId) return;
    if (user?._id && authorId === user._id) {
      router.push("/(tabs)/Profile");
    } else {
      router.push(`/profile/${authorId}`);
    }
  };

  // ─────────────────────────────────────────────
  // FETCH POST & COMMENTS
  // ─────────────────────────────────────────────

  const fetchPost = useCallback(async () => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);
      const postData = await getCommunityPost(id);
      setPost(postData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    try {
      setCommentsLoading(true);
      const result = await getCommunityComments(id);
      setComments(result.comments);
    } catch {
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      void fetchPost();
      void fetchComments();
    }
  }, [id, fetchPost, fetchComments]);

  // ─────────────────────────────────────────────
  // LIKE & SAVE ACTIONS
  // ─────────────────────────────────────────────

  const handleLike = async () => {
    if (!post || isLiking) return;
    const currentlyLiked = post.isLiked;
    const currentCount = post.likeCount || 0;

    // Optimistic UI update
    setPost({
      ...post,
      isLiked: !currentlyLiked,
      likeCount: currentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
    });

    try {
      setIsLiking(true);
      if (currentlyLiked) {
        const res = await unlikeCommunityPost(post._id);
        setPost((prev) =>
          prev ? { ...prev, isLiked: res.isLiked, likeCount: res.likeCount } : null
        );
      } else {
        const res = await likeCommunityPost(post._id);
        setPost((prev) =>
          prev ? { ...prev, isLiked: res.isLiked, likeCount: res.likeCount } : null
        );
      }
    } catch {
      // Revert on failure
      setPost((prev) =>
        prev ? { ...prev, isLiked: currentlyLiked, likeCount: currentCount } : null
      );
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!post || isSaving) return;
    const currentlySaved = post.isSaved;

    // Optimistic UI update
    setPost({
      ...post,
      isSaved: !currentlySaved,
    });

    try {
      setIsSaving(true);
      if (currentlySaved) {
        const res = await unsaveCommunityPost(post._id);
        setPost((prev) => (prev ? { ...prev, isSaved: res.isSaved } : null));
      } else {
        const res = await saveCommunityPost(post._id);
        setPost((prev) => (prev ? { ...prev, isSaved: res.isSaved } : null));
      }
    } catch {
      // Revert on failure
      setPost((prev) => (prev ? { ...prev, isSaved: currentlySaved } : null));
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // COMMENT SUBMIT & REPLY
  // ─────────────────────────────────────────────

  const handleStartReply = (comment: CommunityComment) => {
    const targetParentId = comment.parentCommentId || comment._id;
    setReplyingTo({
      commentId: targetParentId,
      username: comment.username || "User",
    });
    inputRef.current?.focus();
  };

  const handleAddComment = async () => {
    const trimmed = commentText.trim();
    if (!id || !trimmed || submittingComment) return;

    try {
      setSubmittingComment(true);
      const parentId = replyingTo ? replyingTo.commentId : null;
      const result = await createCommunityComment(id, trimmed, parentId);
      setComments((prev) => [...prev, result.comment]);
      setCommentText("");
      setReplyingTo(null);
      setPost((prev) =>
        prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : null
      );
    } catch (err: any) {
      Alert.alert(
        "Unable to post comment",
        err?.response?.data?.message || "Please try again."
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  // ─────────────────────────────────────────────
  // COMMENT DELETE (LONG PRESS)
  // ─────────────────────────────────────────────

  const canDeleteComment = (comment: CommunityComment) => {
    if (comment.canDelete) return true;
    if (post?.isOwner) return true;
    if (user?._id && comment.userId === user._id) return true;
    return false;
  };

  const handleCommentLongPress = (comment: CommunityComment) => {
    if (!canDeleteComment(comment)) {
      handleStartReply(comment);
      return;
    }

    Alert.alert(
      "Delete comment?",
      "Are you sure you want to delete this comment? This will also remove any replies.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void executeDeleteComment(comment._id),
        },
      ]
    );
  };

  const executeDeleteComment = async (commentId: string) => {
    if (!post) return;
    try {
      // Optimistic delete
      setComments((prev) =>
        prev.filter((c) => c._id !== commentId && c.parentCommentId !== commentId)
      );
      const res = await deleteCommunityComment(post._id, commentId);
      setPost((prev) =>
        prev ? { ...prev, commentCount: res.commentCount } : null
      );
    } catch (deleteError: any) {
      Alert.alert(
        "Unable to delete comment",
        deleteError?.response?.data?.message || "Please try again."
      );
      void fetchComments();
    }
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />

          <Text style={styles.headerTitle}>
            Community Feed
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* LOADING */}
        {loading && (
          <View style={styles.centeredState}>
            <ActivityIndicator
              size="large"
              color="#775a00"
            />
            <Text style={styles.stateText}>
              Loading post...
            </Text>
          </View>
        )}

        {/* ERROR */}
        {!loading && error && (
          <View style={styles.centeredState}>
            <Ionicons
              name="cloud-offline-outline"
              size={40}
              color="#837565"
            />
            <Text style={styles.stateText}>
              Failed to load post.
            </Text>

            <TouchableOpacity
              style={styles.retryBtn}
              onPress={fetchPost}
            >
              <Text style={styles.retryBtnText}>
                Retry
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* POST CONTENT */}
        {!loading && !error && post && (
          <CommunityPostDetails
            post={post}
            comments={comments}
            commentsLoading={commentsLoading}
            menuVisible={menuVisible}
            scrollViewRef={scrollViewRef}
            inputRef={inputRef}
            setMenuVisible={setMenuVisible}
            setReportVisible={setReportVisible}
            canDeleteComment={canDeleteComment}
            onAuthorPress={handleAuthorPress}
            onCommentLongPress={handleCommentLongPress}
            onReply={handleStartReply}
            onLike={handleLike}
            onSave={handleSave}
            onEdit={() =>
              router.push({
                pathname: "/community-feed/EditCommunityPost",
                params: { id: post._id },
              })
            }
            onDelete={handleDelete}
          />
        )}

        {/* ── DOCKED BOTTOM COMPOSER ── */}
        {!loading && !error && post && (
          <View style={styles.bottomComposerContainer}>
            {replyingTo && (
              <View style={styles.replyingBar}>
                <View style={styles.replyingLeftGroup}>
                  <Ionicons name="return-down-forward" size={14} color="#8B5E00" />
                  <Text style={styles.replyingText}>
                    Replying to <Text style={styles.replyingUsername}>@{replyingTo.username}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setReplyingTo(null)}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={18} color="#8A7E6C" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.composerWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.commentInput}
                placeholder={
                  replyingTo
                    ? `Reply to @${replyingTo.username}…`
                    : "Write a comment…"
                }
                placeholderTextColor="#9E9385"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
                editable={!submittingComment}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!commentText.trim() || submittingComment) && styles.sendBtnDisabled,
                ]}
                onPress={handleAddComment}
                disabled={!commentText.trim() || submittingComment}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#161c27" />
                ) : (
                  <Ionicons name="send" size={16} color="#161c27" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* REPORT POST MODAL */}
        <ReportPostModal
          visible={reportVisible}
          onClose={() => setReportVisible(false)}
          onSubmit={async (reason) => {
            if (post) await reportCommunityPost(post._id, reason);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#161c27",
  },

  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  stateText: {
    fontSize: 14,
    color: "#837565",
    fontWeight: "500",
  },

  retryBtn: {
    backgroundColor: "#fcd371",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },

  retryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#775a00",
  },

  /* ── Bottom Docked Composer ── */
  bottomComposerContainer: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },

  replyingBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF5E5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFE2B3",
  },

  replyingLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },

  replyingText: {
    fontSize: 12,
    color: "#8B5E00",
  },

  replyingUsername: {
    fontWeight: "700",
  },

  composerWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#F7F6F2",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#EAE5DC",
    gap: 8,
  },

  commentInput: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    paddingVertical: 6,
    fontSize: 14,
    color: "#161c27",
  },

  sendBtn: {
    backgroundColor: colors.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  sendBtnDisabled: {
    opacity: 0.4,
  },
});

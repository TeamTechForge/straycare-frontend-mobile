import { Ionicons } from "@expo/vector-icons";
import type { RefObject } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import OwnerActionButtons from "../../components/OwnerActionButtons";
import { colors } from "../../constants/colors.constants";
import type {
  CommunityComment,
  CommunityPost,
} from "../../services/communityService";

interface CommunityPostDetailsProps {
  post: CommunityPost;
  comments: CommunityComment[];
  commentsLoading: boolean;
  menuVisible: boolean;
  scrollViewRef: RefObject<ScrollView | null>;
  inputRef: RefObject<TextInput | null>;
  setMenuVisible: (value: boolean | ((previous: boolean) => boolean)) => void;
  setReportVisible: (visible: boolean) => void;
  canDeleteComment: (comment: CommunityComment) => boolean;
  onAuthorPress: (authorId?: string | null) => void;
  onCommentLongPress: (comment: CommunityComment) => void;
  onReply: (comment: CommunityComment) => void;
  onLike: () => void;
  onSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

const getImageUrl = (imageUrl?: string | null) => imageUrl || null;

export default function CommunityPostDetails({
  post,
  comments,
  commentsLoading,
  menuVisible,
  scrollViewRef,
  inputRef,
  setMenuVisible,
  setReportVisible,
  canDeleteComment,
  onAuthorPress: handleAuthorPress,
  onCommentLongPress: handleCommentLongPress,
  onReply: handleStartReply,
  onLike: handleLike,
  onSave: handleSave,
  onEdit,
  onDelete: handleDelete,
}: CommunityPostDetailsProps) {
  return (
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              {/* IMAGE + 3-DOTS CORNER BUTTON & DROPDOWN */}
              {getImageUrl(post.imageUrl) ? (
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: getImageUrl(post.imageUrl)! }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                  {/* 3-DOTS CORNER BUTTON & DROPDOWN (ONLY SHOWN FOR NON-OWNERS TO REPORT; OWNERS HAVE EDIT/DELETE BUTTONS AT BOTTOM) */}
                  {!post.isOwner && (
                    <>
                      <TouchableOpacity
                        style={styles.photoCornerDotsBtn}
                        onPress={() => setMenuVisible((prev) => !prev)}
                        activeOpacity={0.8}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="ellipsis-horizontal"
                          size={18}
                          color="#ffffff"
                        />
                      </TouchableOpacity>

                      {/* IN-PLACE OVERFLOW DROPDOWN FOR PHOTO POSTS */}
                      {menuVisible && (
                        <View style={styles.photoOverflowDropdown}>
                          <TouchableOpacity
                            style={styles.overflowDropdownItem}
                            onPress={() => {
                              setMenuVisible(false);
                              setReportVisible(true);
                            }}
                          >
                            <Ionicons name="flag-outline" size={16} color="#E53935" />
                            <Text style={styles.overflowDropdownItemTextDestructive}>Report Post</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </View>
              ) : null}

              <View style={styles.cardBody}>
                {/* DATE + CATEGORY + 3-DOTS FOR TEXT POSTS */}
                <View style={styles.metaRow}>
                  <Text style={styles.dateText}>
                    {formatDate(post.submittedAt || post.createdAt)}
                  </Text>

                  <View style={styles.metaRightGroup}>
                    {post.category && (
                      <View style={styles.tagBadge}>
                        <Text style={styles.tagText} numberOfLines={1}>
                          {post.category}
                        </Text>
                      </View>
                    )}

                    {!getImageUrl(post.imageUrl) && !post.isOwner && (
                      <View style={{ position: "relative" }}>
                        <TouchableOpacity
                          style={styles.textPostDotsBtn}
                          onPress={() => setMenuVisible((prev) => !prev)}
                          hitSlop={8}
                        >
                          <Ionicons
                            name="ellipsis-vertical"
                            size={18}
                            color="#685F51"
                          />
                        </TouchableOpacity>

                        {/* IN-PLACE OVERFLOW DROPDOWN FOR TEXT POSTS */}
                        {menuVisible && (
                          <View style={styles.textOverflowDropdown}>
                            <TouchableOpacity
                              style={styles.overflowDropdownItem}
                              onPress={() => {
                                setMenuVisible(false);
                                setReportVisible(true);
                              }}
                            >
                              <Ionicons name="flag-outline" size={16} color="#E53935" />
                              <Text style={styles.overflowDropdownItemTextDestructive}>Report Post</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* TITLE */}
                <Text style={styles.headline}>
                  {post.title}
                </Text>

                {/* AUTHOR (CLICKABLE) */}
                <TouchableOpacity
                  style={styles.authorRow}
                  onPress={() =>
                    handleAuthorPress(post.authorUserId || post.authorId)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.authorInfo}>
                    {post.profileImage ? (
                      <Image
                        source={{ uri: post.profileImage }}
                        style={styles.authorAvatar}
                      />
                    ) : (
                      <View style={styles.authorAvatarFallback}>
                        <Ionicons name="person" size={16} color="#7F7665" />
                      </View>
                    )}
                    <Text style={styles.authorText}>
                      Posted by{" "}
                      <Text style={styles.authorName}>
                        {post.username || post.authorName || "Community User"}
                      </Text>
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#A89E8F" />
                </TouchableOpacity>

                {/* CONTENT */}
                <View style={styles.contentAccent}>
                  <Text style={styles.description}>{post.content}</Text>
                </View>

                {/* ── ENGAGEMENT BAR (LIKES, COMMENTS, SAVE) ── */}
                <View style={styles.cardActionRow}>
                  {/* Like button */}
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={handleLike}
                    activeOpacity={0.7}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={post.isLiked ? "heart" : "heart-outline"}
                      size={22}
                      color={post.isLiked ? "#E53935" : "#685F51"}
                    />
                    <Text
                      style={[
                        styles.cardActionText,
                        post.isLiked && styles.cardActionTextActive,
                      ]}
                    >
                      {post.likeCount || 0} {post.likeCount === 1 ? "Like" : "Likes"}
                    </Text>
                  </TouchableOpacity>

                  {/* Comment counter indicator */}
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => inputRef.current?.focus()}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={20}
                      color="#685F51"
                    />
                    <Text style={styles.cardActionText}>
                      {comments.length || post.commentCount || 0}{" "}
                      {(comments.length || post.commentCount) === 1 ? "Comment" : "Comments"}
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flex: 1 }} />

                  {/* Save bookmark */}
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    activeOpacity={0.7}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={post.isSaved ? "bookmark" : "bookmark-outline"}
                      size={22}
                      color={post.isSaved ? colors.primary : "#685F51"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <CommentsSection
              comments={comments}
              loading={commentsLoading}
              canDeleteComment={canDeleteComment}
              onAuthorPress={handleAuthorPress}
              onCommentLongPress={handleCommentLongPress}
              onReply={handleStartReply}
            />

            {/* OWNER ACTION BUTTONS IF OWNER */}
            {post.isOwner && (
              <View style={styles.actionsContainer}>
                <OwnerActionButtons
                  onEdit={onEdit}
                  onDelete={handleDelete}
                  editLabel="Edit Post"
                  deleteLabel="Delete Post"
                  containerStyle={{ marginTop: 0, borderTopWidth: 0, paddingTop: 0 }}
                />
              </View>
            )}
          </ScrollView>
  );
}

interface CommentsSectionProps {
  comments: CommunityComment[];
  loading: boolean;
  canDeleteComment: (comment: CommunityComment) => boolean;
  onAuthorPress: (authorId?: string | null) => void;
  onCommentLongPress: (comment: CommunityComment) => void;
  onReply: (comment: CommunityComment) => void;
}

function formatCommentDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CommentsSection({
  comments,
  loading,
  canDeleteComment,
  onAuthorPress,
  onCommentLongPress,
  onReply,
}: CommentsSectionProps) {
  const rootComments = comments.filter((comment) => !comment.parentCommentId);
  const getReplies = (parentId: string) =>
    comments.filter((comment) => comment.parentCommentId === parentId);

  return (
    <View style={commentsStyles.commentsSection}>
      <View style={commentsStyles.commentsHeaderRow}>
        <View style={commentsStyles.commentsTitleGroup}>
          <Ionicons name="chatbubbles" size={20} color="#161c27" />
          <Text style={commentsStyles.commentsSectionTitle}>Comments</Text>
        </View>
        <View style={commentsStyles.commentsCountBadge}>
          <Text style={commentsStyles.commentsCountBadgeText}>{comments.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={commentsStyles.commentsLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={commentsStyles.commentsLoadingText}>Loading comments...</Text>
        </View>
      ) : comments.length === 0 ? (
        <View style={commentsStyles.noCommentsContainer}>
          <Ionicons name="chatbubbles-outline" size={36} color="#D2C7B6" />
          <Text style={commentsStyles.noCommentsTitle}>No comments yet</Text>
          <Text style={commentsStyles.noCommentsSub}>Be the first to share your thoughts!</Text>
        </View>
      ) : (
        <View style={commentsStyles.commentsList}>
          {rootComments.map((comment) => {
            const replies = getReplies(comment._id);
            const isDeletable = canDeleteComment(comment);

            return (
              <View key={comment._id} style={commentsStyles.commentBlock}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onLongPress={() => onCommentLongPress(comment)}
                  delayLongPress={350}
                  style={commentsStyles.commentCard}
                >
                  <TouchableOpacity
                    onPress={() => onAuthorPress(comment.userId)}
                    activeOpacity={0.7}
                  >
                    {comment.profileImage ? (
                      <Image source={{ uri: comment.profileImage }} style={commentsStyles.commentAvatar} />
                    ) : (
                      <View style={commentsStyles.commentAvatarFallback}>
                        <Ionicons name="person" size={16} color="#7F7665" />
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={commentsStyles.commentContentWrapper}>
                    <View style={commentsStyles.commentMetaRow}>
                      <TouchableOpacity
                        onPress={() => onAuthorPress(comment.userId)}
                        activeOpacity={0.7}
                        style={{ flex: 1 }}
                      >
                        <Text style={commentsStyles.commentUsername} numberOfLines={1}>
                          {comment.username || "Community Member"}
                        </Text>
                      </TouchableOpacity>
                      <Text style={commentsStyles.commentDate}>
                        {formatCommentDate(comment.createdAt)}
                      </Text>
                    </View>
                    <Text style={commentsStyles.commentText}>{comment.content}</Text>

                    <View style={commentsStyles.commentFooterRow}>
                      <TouchableOpacity
                        style={commentsStyles.replyActionBtn}
                        onPress={() => onReply(comment)}
                        hitSlop={6}
                      >
                        <Ionicons name="return-down-forward" size={14} color="#8A7E6C" />
                        <Text style={commentsStyles.replyActionText}>Reply</Text>
                      </TouchableOpacity>

                      {isDeletable && (
                        <TouchableOpacity
                          style={commentsStyles.deleteActionBtn}
                          onPress={() => onCommentLongPress(comment)}
                          hitSlop={6}
                        >
                          <Ionicons name="trash-outline" size={13} color="#D32F2F" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                {replies.length > 0 && (
                  <View style={commentsStyles.repliesWrapper}>
                    {replies.map((reply) => {
                      const isReplyDeletable = canDeleteComment(reply);

                      return (
                        <TouchableOpacity
                          key={reply._id}
                          activeOpacity={0.9}
                          onLongPress={() => onCommentLongPress(reply)}
                          delayLongPress={350}
                          style={commentsStyles.replyCard}
                        >
                          <TouchableOpacity
                            onPress={() => onAuthorPress(reply.userId)}
                            activeOpacity={0.7}
                          >
                            {reply.profileImage ? (
                              <Image source={{ uri: reply.profileImage }} style={commentsStyles.replyAvatar} />
                            ) : (
                              <View style={commentsStyles.replyAvatarFallback}>
                                <Ionicons name="person" size={13} color="#7F7665" />
                              </View>
                            )}
                          </TouchableOpacity>

                          <View style={commentsStyles.replyContentWrapper}>
                            <View style={commentsStyles.commentMetaRow}>
                              <TouchableOpacity
                                onPress={() => onAuthorPress(reply.userId)}
                                activeOpacity={0.7}
                                style={{ flex: 1 }}
                              >
                                <Text style={commentsStyles.replyUsername} numberOfLines={1}>
                                  {reply.username || "Community Member"}
                                </Text>
                              </TouchableOpacity>
                              <Text style={commentsStyles.commentDate}>
                                {formatCommentDate(reply.createdAt)}
                              </Text>
                            </View>
                            <Text style={commentsStyles.replyText}>{reply.content}</Text>

                            <View style={commentsStyles.commentFooterRow}>
                              <TouchableOpacity
                                style={commentsStyles.replyActionBtn}
                                onPress={() => onReply(reply)}
                                hitSlop={6}
                              >
                                <Ionicons name="return-down-forward" size={13} color="#8A7E6C" />
                                <Text style={commentsStyles.replyActionText}>Reply</Text>
                              </TouchableOpacity>

                              {isReplyDeletable && (
                                <TouchableOpacity
                                  style={commentsStyles.deleteActionBtn}
                                  onPress={() => onCommentLongPress(reply)}
                                  hitSlop={6}
                                >
                                  <Ionicons name="trash-outline" size={13} color="#D32F2F" />
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    overflow: "visible",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 10,
  },

  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 220,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
    zIndex: 20,
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  photoCornerDotsBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },

  /* ── In-place Dropdown Menus ── */
  photoOverflowDropdown: {
    position: "absolute",
    top: 50,
    right: 12,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    zIndex: 40,
  },

  textOverflowDropdown: {
    position: "absolute",
    top: 34,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    zIndex: 40,
  },

  overflowDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },

  overflowDropdownItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#161c27",
  },

  overflowDropdownItemTextDestructive: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E53935",
  },

  overflowDropdownDivider: {
    height: 1,
    backgroundColor: "#F3F3F3",
    marginHorizontal: 8,
  },

  cardBody: {
    padding: 18,
    gap: 12,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  metaRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  dateText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "#837565",
  },

  tagBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    maxWidth: 160,
  },

  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },

  textPostDotsBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3EFEA",
    alignItems: "center",
    justifyContent: "center",
  },

  headline: {
    fontSize: 21,
    fontWeight: "800",
    color: "#161c27",
    lineHeight: 27,
  },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F3F3",
  },

  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },

  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },

  authorAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF0DD",
    alignItems: "center",
    justifyContent: "center",
  },

  authorText: {
    fontSize: 14,
    color: "#504537",
    flex: 1,
  },

  authorName: {
    fontWeight: "700",
    color: "#161c27",
  },

  contentAccent: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 14,
    marginVertical: 4,
  },

  description: {
    fontSize: 15,
    color: "#4A4032",
    lineHeight: 24,
  },

  /* ── Engagement Action Row inside Card ── */
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 14,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#F3F3F3",
    gap: 16,
  },

  cardActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  cardActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#685F51",
  },

  cardActionTextActive: {
    color: "#E53935",
    fontWeight: "700",
  },

  saveBtn: {
    padding: 4,
  },

  /* ── Actions ── */
  actionsContainer: {
    marginTop: 4,
  },
});

const commentsStyles = StyleSheet.create({
  commentsSection: {
    backgroundColor: "#ffffff", borderRadius: 18, padding: 18, borderWidth: 1,
    borderColor: "#EFEFEF", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, gap: 14,
  },
  commentsHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  commentsTitleGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentsSectionTitle: { fontSize: 17, fontWeight: "700", color: "#161c27" },
  commentsCountBadge: { backgroundColor: "#FFF2DE", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  commentsCountBadgeText: { fontSize: 12, fontWeight: "700", color: "#8B5E00" },
  commentsLoading: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 18 },
  commentsLoadingText: { fontSize: 13, color: "#837565" },
  noCommentsContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 24, gap: 6 },
  noCommentsTitle: { fontSize: 15, fontWeight: "700", color: "#5C5243" },
  noCommentsSub: { fontSize: 13, color: "#8F8474" },
  commentsList: { gap: 14, marginTop: 4 },
  commentBlock: { gap: 10 },
  commentCard: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18 },
  commentAvatarFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFF0DD", alignItems: "center", justifyContent: "center" },
  commentContentWrapper: { flex: 1, backgroundColor: "#FAF9F6", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#EFEBE4" },
  commentMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 },
  commentUsername: { fontSize: 13, fontWeight: "700", color: "#161c27", flex: 1 },
  commentDate: { fontSize: 11, color: "#8C8171" },
  commentText: { fontSize: 14, color: "#4A4032", lineHeight: 20 },
  commentFooterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#EAE5DC60" },
  replyActionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  replyActionText: { fontSize: 12, fontWeight: "700", color: "#8A7E6C" },
  deleteActionBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  repliesWrapper: { marginLeft: 24, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: "#E8E2D8", gap: 10 },
  replyCard: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  replyAvatar: { width: 30, height: 30, borderRadius: 15 },
  replyAvatarFallback: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#FFF0DD", alignItems: "center", justifyContent: "center" },
  replyContentWrapper: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#EAE5DC" },
  replyUsername: { fontSize: 12, fontWeight: "700", color: "#161c27", flex: 1 },
  replyText: { fontSize: 13, color: "#4A4032", lineHeight: 18 },
});

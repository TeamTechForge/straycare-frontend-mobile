// app/community-feed/CommunityPostView.tsx

import {
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";

import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getCommunityPost,
  CommunityPost,
  deleteCommunityPost,
  reportCommunityPost,
} from "../../services/communityService";
import ReportPostModal from "../../components/ReportPostModal";

// ─────────────────────────────────────────────
// DATE
// ─────────────────────────────────────────────

function formatDate(
  dateStr?: string
): string {
  if (!dateStr) {
    return "";
  }

  const date = new Date(dateStr);

  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function CommunityPostView() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [post, setPost] =
    useState<CommunityPost | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);
  const [reportVisible, setReportVisible] = useState(false);

  const handleDelete = () => {
    if (!post) return;
    Alert.alert("Delete post?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await deleteCommunityPost(post._id);
          router.replace("/community-feed/CommunityPostMain");
        } catch (deleteError: any) {
          Alert.alert("Unable to delete post", deleteError?.response?.data?.message || "Please try again.");
        }
      } },
    ]);
  };

  // ─────────────────────────────────────────────
  // FETCH POST
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

      // getCommunityPost already returns CommunityPost
      const postData =
        await getCommunityPost(id);

      setPost(postData);
    } catch (err) {
      console.error(
        "Fetch community post error:",
        err
      );

      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      void fetchPost();
    }
  }, [id, fetchPost]);

  // ─────────────────────────────────────────────
  // IMAGE URL
  // ─────────────────────────────────────────────

  const getImageUrl = (
    imageUrl?: string | null
  ) => {
    if (!imageUrl) {
      return null;
    }

    // Cloudinary URL
    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    // Backend relative image
    return imageUrl;
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#161c27"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Community Feed
        </Text>

        <View style={styles.iconBtn} />
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

      {/* POST */}

      {!loading &&
        !error &&
        post && (
          <ScrollView
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {/* IMAGE */}

              {getImageUrl(
                post.imageUrl
              ) && (
                  <Image
                    source={{
                      uri: getImageUrl(
                        post.imageUrl
                      )!,
                    }}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                )}

              <View style={styles.cardBody}>
                {/* DATE + CATEGORY */}

                <View style={styles.metaRow}>
                  <Text
                    style={styles.dateText}
                  >
                    {formatDate(
                      post.submittedAt ||
                      post.createdAt
                    )}
                  </Text>

                  <View
                    style={styles.tagBadge}
                  >
                    <Text
                      style={styles.tagText}
                    >
                      {post.category}
                    </Text>
                  </View>
                </View>

                {/* TITLE */}

                <Text style={styles.headline}>
                  {post.title}
                </Text>

                {/* AUTHOR */}

                <View
                  style={styles.authorRow}
                >
                  <Text
                    style={styles.authorText}
                  >
                    Posted by{" "}
                    <Text
                      style={styles.authorName}
                    >
                      {post.username || post.authorName ||
                        "Community User"}
                    </Text>
                  </Text>
                </View>

                {/* CONTENT */}

                <Text
                  style={styles.description}
                >
                  {post.content}
                </Text>
              </View>
            </View>

            {/* ACTIONS */}

            <View
              style={styles.actionsContainer}
            >
              {/* BACK */}

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() =>
                  router.back()
                }
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color="#704900"
                />

                <Text
                  style={styles.backBtnText}
                >
                  Back
                </Text>
              </TouchableOpacity>

              {post.isOwner ? <>
                <TouchableOpacity style={styles.ownerBtn} onPress={() => router.push({ pathname: "/community-feed/EditCommunityPost", params: { id: post._id } })}>
                  <Ionicons name="create-outline" size={20} color="#704900" />
                  <Text style={styles.ownerBtnText}>Edit Post</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reportBtn} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={20} color="#E54D4D" />
                  <Text style={styles.reportBtnText}>Delete Post</Text>
                </TouchableOpacity>
              </> : <TouchableOpacity
                style={styles.reportBtn}
                onPress={() => setReportVisible(true)}
              >
                <MaterialIcons
                  name="report"
                  size={20}
                  color="#E54D4D"
                />

                <Text
                  style={styles.reportBtnText}
                >
                  Report Post
                </Text>
              </TouchableOpacity>}
            </View>
          </ScrollView>
        )}
      <ReportPostModal visible={reportVisible} onClose={() => setReportVisible(false)} onSubmit={async (reason) => {
        if (post) await reportCommunityPost(post._id, reason);
      }} />
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9ff",
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

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F1F1",
  },

  heroImage: {
    width: "100%",
    height: 220,
  },

  cardBody: {
    padding: 20,
    gap: 12,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dateText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "#837565",
  },

  tagBadge: {
    backgroundColor: "#E6F7ED",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: "60%",
  },

  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#27C468",
  },

  headline: {
    fontSize: 22,
    fontWeight: "800",
    color: "#161c27",
    lineHeight: 28,
  },

  authorRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F1F1",
  },

  authorText: {
    fontSize: 15,
    color: "#504537",
  },

  authorName: {
    fontWeight: "700",
    color: "#161c27",
  },

  description: {
    fontSize: 15,
    color: "#504537",
    lineHeight: 24,
  },

  actionsContainer: {
    gap: 12,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f9b959",
    borderRadius: 999,
    paddingVertical: 16,
  },

  backBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#704900",
  },

  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFF1F1",
    borderRadius: 999,
    paddingVertical: 16,
  },

  reportBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E54D4D",
  },
  ownerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#FFF0DD", borderRadius: 999, paddingVertical: 16 },
  ownerBtnText: { fontSize: 15, fontWeight: "700", color: "#704900" },
});

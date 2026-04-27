import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { getCommunityFeed } from "../../api/api";

const C = {
  surface: "#f9f9ff",
  surfaceContainerLowest: "#ffffff",
  onSurface: "#121c2c",
  onSurfaceVariant: "#4d4637",
  outline: "#7f7665",
  outlineVariant: "#d1c5b2",
  primary: "#775a00",
  primaryContainer: "#fcd371",
  onPrimaryContainer: "#765a00",
};

const CATEGORIES = [
  "Pet Care Tips",
  "Health & First Aid",
  "Stray Animal Help",
  "Training & Behavior",
  "Animal Welfare & Rights Awareness",
  "Success Stories",
  "Events & Campaigns",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).toUpperCase();
}

// ── Post Card Component ───────────────────────────────────────────────────────
function PostCard({ post }: { post: any }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() =>
        router.push({
          pathname: "/communityFeed/communityPostView",
          params: { id: post._id },
        })
      }
    >
      <View style={styles.card}>
        {/* Author row */}
        <View style={styles.cardHeader}>
          <View style={styles.authorRow}>
            {/* Avatar placeholder using first letter of author name */}
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {post.authorName?.charAt(0).toUpperCase() ?? "?"}
              </Text>
            </View>
            <View>
              <Text style={styles.authorName}>{post.authorName}</Text>
              <Text style={styles.authorMeta}>
                {formatDate(post.submittedAt)} • {post.category}
              </Text>
            </View>
          </View>
          <TouchableOpacity>
            <MaterialIcons name="more-horiz" size={20} color={C.outline} />
          </TouchableOpacity>
        </View>

        {/* Post image — only show if imageUrl exists */}
        {post.imageUrl ? (
          <Image
            source={{ uri: `http://10.225.98.94:5000${post.imageUrl}` }}
            style={styles.postImage}
            resizeMode="cover"
          />
        ) : null}

        {/* Title + body */}
        <View style={styles.cardBody}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postBody} numberOfLines={4}>
            {post.content}
          </Text>
        </View>

        {/* Actions row */}
        <View style={styles.actionsRow}>
          <View style={styles.actionsLeft}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(e) => {
                e.stopPropagation();
                setLiked(!liked);
              }}
            >
              <MaterialCommunityIcons
                name={liked ? "heart" : "heart-outline"}
                size={22}
                color={liked ? C.primary : C.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              setSaved(!saved);
            }}
          >
            <MaterialCommunityIcons
              name={saved ? "bookmark" : "bookmark-outline"}
              size={22}
              color={C.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CommunityFeed() {
  const router = useRouter();
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchText, setSearchText] = useState("");

  // Data states
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ── Fetch posts from backend ──────────────────────────────────────────────
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await getCommunityFeed();
      if (response.data.success) {
        setPosts(response.data.data);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Filter posts by search text and active category ───────────────────────
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      searchText.trim() === "" ||
      post.title.toLowerCase().includes(searchText.toLowerCase()) ||
      post.content.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory =
      activeCategory === "" || post.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/")}>
          <Ionicons name="chevron-back" size={26} color={C.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Feed</Text>
        <TouchableOpacity
          onPress={() => router.push("/communityFeed/createCommunityPost")}
        >
          <Ionicons name="add" size={26} color={C.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={C.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts..."
            placeholderTextColor={C.outline}
            value={searchText}
            onChangeText={setSearchText}
          />
          <TouchableOpacity onPress={() => setFilterVisible(!filterVisible)}>
            <MaterialIcons name="tune" size={20} color={C.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Category Filter Pills */}
        {filterVisible && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {/* "All" pill to clear category filter */}
            <TouchableOpacity
              style={[
                styles.categoryPill,
                activeCategory === ""
                  ? styles.categoryPillActive
                  : styles.categoryPillInactive,
              ]}
              onPress={() => setActiveCategory("")}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  { color: activeCategory === "" ? C.onPrimaryContainer : C.onSurfaceVariant },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    isActive ? styles.categoryPillActive : styles.categoryPillInactive,
                  ]}
                  onPress={() => setActiveCategory(isActive ? "" : cat)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: isActive ? C.onPrimaryContainer : C.onSurfaceVariant },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* ── Feed Content ── */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading state */}
        {loading && (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.stateText}>Loading posts...</Text>
          </View>
        )}

        {/* Error state */}
        {!loading && error && (
          <View style={styles.centeredState}>
            <MaterialCommunityIcons
              name="wifi-off"
              size={40}
              color={C.outline}
            />
            <Text style={styles.stateText}>Failed to load posts.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchPosts}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && filteredPosts.length === 0 && (
          <View style={styles.centeredState}>
            <MaterialCommunityIcons
              name="post-outline"
              size={40}
              color={C.outline}
            />
            <Text style={styles.stateText}>No posts found.</Text>
            {(searchText || activeCategory) && (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  setSearchText("");
                  setActiveCategory("");
                }}
              >
                <Text style={styles.retryBtnText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Posts */}
        {!loading && !error && filteredPosts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9ff",
    paddingTop: 50,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#f9f9ff",
    borderBottomWidth: 1,
    borderBottomColor: "#d1c5b220",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#121c2c",
  },

  // Search
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f9f9ff",
    borderBottomWidth: 1,
    borderBottomColor: "#d1c5b215",
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1c5b240",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#121c2c",
    padding: 0,
  },

  // Category pills
  categoryScroll: {
    flexGrow: 0,
  },
  categoryContent: {
    gap: 8,
    paddingBottom: 2,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  categoryPillActive: {
    backgroundColor: "#fcd371",
  },
  categoryPillInactive: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1c5b240",
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Feed
  feed: {
    flex: 1,
  },
  feedContent: {
    padding: 16,
    gap: 16,
  },

  // Post Card
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d1c5b220",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fcd371",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: "700",
    color: "#775a00",
  },
  authorName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#121c2c",
    letterSpacing: 0.2,
  },
  authorMeta: {
    fontSize: 10,
    color: "#7f7665",
    marginTop: 1,
  },
  postImage: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  cardBody: {
    padding: 12,
    gap: 4,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#121c2c",
  },
  postBody: {
    fontSize: 13,
    color: "#4d4637",
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#d1c5b215",
  },
  actionsLeft: {
    flexDirection: "row",
    gap: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  // States
  centeredState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    color: "#7f7665",
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
});
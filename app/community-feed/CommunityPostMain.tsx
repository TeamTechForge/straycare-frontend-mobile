import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,  // Spinner shown while posts are loading
  Image,              // Renders post images
  ScrollView,         // Scrollable container for feed and category pills
  StyleSheet,
  Text,
  TextInput,          // Search input field
  TouchableOpacity,   // Touchable wrapper with opacity feedback
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getCommunityFeed } from "../../api/api.service"; // API call to fetch posts


const C = {
  surface: "#f9f9ff",                // Main background color
  surfaceContainerLowest: "#ffffff", // Card/input background
  onSurface: "#121c2c",             // Primary text color
  onSurfaceVariant: "#4d4637",      // Secondary text color
  outline: "#7f7665",               // Borders and muted icons
  outlineVariant: "#d1c5b2",        // Subtle divider lines
  primary: "#775a00",               // Primary brand color (dark gold)
  primaryContainer: "#fcd371",      // Active pill and avatar background (light gold)
  onPrimaryContainer: "#765a00",    // Text on top of primary container
};

// CATEGORY LIST

const CATEGORIES = [
  "Pet Care Tips",
  "Health & First Aid",
  "Stray Animal Help",
  "Training & Behavior",
  "Animal Welfare & Rights Awareness",
  "Success Stories",
  "Events & Campaigns",
];

//format data
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).toUpperCase(); // Uppercase for stylistic consistency
}

//component postcard
function PostCard({ post }: { post: any }) {
  const router = useRouter();

  // Local UI state — not added to backend yet
  const [liked, setLiked] = useState(false);   // Tracks whether the user has liked this post
  const [saved, setSaved] = useState(false);   // Tracks whether the user has saved this post

  return (
    // Tapping anywhere on the card navigates to the full post view
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() =>
        router.push({
          pathname: "/community-feed/CommunityPostView",
          params: { id: post._id }, // Pass post ID so the view screen can fetch the right post
        })
      }
    >
      <View style={styles.card}>

        {/* CARD HEADER: Author info + overflow menu  */}
        <View style={styles.cardHeader}>
          <View style={styles.authorRow}>

            {/* profile icon: shows first letter of author's name as a placeholder */}
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {post.authorName?.charAt(0).toUpperCase() ?? "?"}
                {/* "?" fallback if authorName is missing */}
              </Text>
            </View>

            {/* Author name and post data */}
            <View>
              <Text style={styles.authorName}>{post.authorName}</Text>
              <Text style={styles.authorMeta}>
                {formatDate(post.submittedAt)} • {post.category}
                {/* e.g. "MAR 15, 2024 • Pet Care Tips" */}
              </Text>
            </View>
          </View>

          {/* Three-dot overflow menu icon (currently no action attached just to show) */}
          <TouchableOpacity>
            <MaterialIcons name="more-horiz" size={20} color={C.outline} />
          </TouchableOpacity>
        </View>

        {/*  POST IMAGE*/}
        {post.imageUrl ? (
          <Image
            source={{ uri: `http://10.87.129.94:5000${post.imageUrl}` }}
            style={styles.postImage}
            resizeMode="cover"
          />
        ) : null}

        {/* Title and content preview */}
        <View style={styles.cardBody}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postBody} numberOfLines={4}>
            {/* Clamp content to 4 lines — user can tap to read more */}
            {post.content}
          </Text>
        </View>

        {/* ── ACTIONS ROW: Like and Save buttons ────────────── */}
        <View style={styles.actionsRow}>

          {/* Left side: Like button */}
          <View style={styles.actionsLeft}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={(e) => {
                e.stopPropagation(); // Prevents card tap from firing when pressing like
                setLiked(!liked);    // Toggle like state
              }}
            >
              <MaterialCommunityIcons
                name={liked ? "heart" : "heart-outline"} // Filled vs outlined heart
                size={22}
                color={liked ? C.primary : C.onSurfaceVariant} // Gold when liked, grey otherwise
              />
            </TouchableOpacity>
          </View>

          {/* Right side: Save/Bookmark button */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation(); // Prevents card tap from firing when pressing save
              setSaved(!saved);    // Toggle save state
            }}
          >
            <MaterialCommunityIcons
              name={saved ? "bookmark" : "bookmark-outline"} // Filled vs outlined bookmark
              size={22}
              color={C.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

      </View>
    </TouchableOpacity>
  );
}


// Handles data fetching, search, category filtering,

export default function CommunityFeed() {
  const router = useRouter();

  // Controls whether the category filter pill row is shown
  const [filterVisible, setFilterVisible] = useState(false);

  // Tracks which category pill is currently selected ("" = All)
  const [activeCategory, setActiveCategory] = useState("");

  // Tracks the text typed into the search bar
  const [searchText, setSearchText] = useState("");

  // Holds the raw list of posts fetched from the backend
  const [posts, setPosts] = useState<any[]>([]);

  // True while the API request is in progress
  const [loading, setLoading] = useState(true);

  // True if the API request failed
  const [error, setError] = useState(false);

  // Fetch posts on initial screen mount 
  useEffect(() => {
    fetchPosts();
  }, []); // Empty dependency array = runs once when screen loads


  // Fetches all posts from the backend and stores them in state.
  // Handles loading and error states around the request.
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await getCommunityFeed();
      if (response.data.success) {
        setPosts(response.data.data); // Store fetched posts

      } else {
        setError(true); // API responded but indicated failure
      }

    } catch (err) {
      console.error("fetch posts error:", err);
      setError(true); // Network error or unexpected exception

    } finally {
      setLoading(false); // Always stop the loading spinner
    }
  };

  // Filters the posts array based on the current search text
  // and selected category. 

  const filteredPosts = posts.filter((post) => {
    // Check if title or content contains the search term (case-insensitive)
    const matchesSearch =
      searchText.trim() === "" ||
      post.title.toLowerCase().includes(searchText.toLowerCase()) ||
      post.content.toLowerCase().includes(searchText.toLowerCase());

    // Check if the post belongs to the selected category
    // Empty string means "All" — no category filter applied
    const matchesCategory =
      activeCategory === "" || post.category === activeCategory;

    return matchesSearch && matchesCategory; // Post must satisfy BOTH conditions
  });

  return (
    <View style={styles.container}>

      {/* Header with Back button | Screen title | Add post button */}
      <View style={styles.header}>

        {/* Back button — goes to the home screen */}
        <TouchableOpacity onPress={() => router.push("/")}>
          <Ionicons name="chevron-back" size={26} color={C.onSurface} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Community Feed</Text>

        {/* Add button — navigates to the create post screen */}
        <TouchableOpacity
          onPress={() => router.push("/community-feed/CreateCommunityPost")}
        >
          <Ionicons name="add" size={26} color={C.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Search bar and category filters Search bar is always visible.
          Category pills appear below only when filter icon is tapped.*/}

      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={C.outline} />

          {/* Controlled text input — updates searchText on every keystroke */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts..."
            placeholderTextColor={C.outline}
            value={searchText}
            onChangeText={setSearchText}
          />

          {/* Filter toggle icon — shows/hides category pill row */}
          <TouchableOpacity onPress={() => setFilterVisible(!filterVisible)}>
            <MaterialIcons name="tune" size={20} color={C.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Horizontally scrollable row of filter pills.
            Only visible when filterVisible is true.*/}

        {filterVisible && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {/* "All" pill — clears the active category filter */}
            <TouchableOpacity
              style={[
                styles.categoryPill,
                activeCategory === ""
                  ? styles.categoryPillActive    // Gold background when selected
                  : styles.categoryPillInactive, // White with border when not selected
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

            {/* Dynamically rendered pill for each category */}
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
                // Tapping an active pill deselects it (toggles back to "All")
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

      {/* Vertically scrollable area that shows one of three states:
          loading spinner, error message, or the list of post cards.*/}

      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
      >

        {/* 1: Loading — show spinner while fetching posts */}
        {loading && (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.stateText}>Loading posts...</Text>
          </View>
        )}

        {/* 2: Error — shown if the API call failed */}
        {!loading && error && (
          <View style={styles.centeredState}>

            <MaterialCommunityIcons name="wifi-off" size={40} color={C.outline} />
            <Text style={styles.stateText}>Failed to load posts.</Text>

            {/* Retry button re-triggers fetchPosts */}
            <TouchableOpacity style={styles.retryBtn} onPress={fetchPosts}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3: Empty — shown when posts loaded but none match the filters */}
        {!loading && !error && filteredPosts.length === 0 && (
          <View style={styles.centeredState}>

            <MaterialCommunityIcons name="post-outline" size={40} color={C.outline} />
            <Text style={styles.stateText}>No posts found.</Text>

            {/* Show "Clear filters" only if a filter is currently active */}
            {(searchText || activeCategory) && (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  setSearchText("");      // Reset search
                  setActiveCategory(""); // Reset category
                }}
              >
                <Text style={styles.retryBtnText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 4: Success — render each post as a PostCard */}
        {!loading && !error && filteredPosts.map((post) => (
          <PostCard key={post._id} post={post} />
          // key={post._id} ensures React can efficiently update the list
        ))}

      </ScrollView>

      {/* Floating AI Discussion Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        activeOpacity={0.85}
        onPress={() => router.push("/DiscussionForum")}
      >
        <LinearGradient
          colors={["#F5A623", "#F8C166"]}
          style={styles.gradientButton}
        >
          <Ionicons name="chatbubbles" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({

  // Root container — fills full screen with surface background
  container: {
    flex: 1,
    backgroundColor: "#f9f9ff",
    paddingTop: 50, // Offset for status bar
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#f9f9ff",
    borderBottomWidth: 1,
    borderBottomColor: "#d1c5b220", // Very subtle bottom border
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#121c2c",
  },

  // ── Search ──────────────────────────────────────────────
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f9f9ff",
    borderBottomWidth: 1,
    borderBottomColor: "#d1c5b215",
    gap: 10, // Space between search bar and category pills
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1c5b240",
    borderRadius: 999,             // Fully rounded pill shape
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,                       // Takes all remaining width between icons
    fontSize: 14,
    color: "#121c2c",
    padding: 0,                    // Removes default TextInput padding
  },

  // ── Category Pills ──────────────────────────────────────
  categoryScroll: {
    flexGrow: 0,                   // Prevents scroll view from expanding vertically
  },
  categoryContent: {
    gap: 8,
    paddingBottom: 2,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,             // Pill shape
  },
  categoryPillActive: {
    backgroundColor: "#fcd371",   // Gold background for selected category
  },
  categoryPillInactive: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1c5b240",     // Subtle border for unselected pills
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // ── Feed ────────────────────────────────────────────────
  feed: {
    flex: 1,
  },
  feedContent: {
    padding: 16,
    gap: 16,                       // Vertical space between post cards
  },

  // ── Post Card ───────────────────────────────────────────
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",            // Clips image corners to match card radius
    borderWidth: 1,
    borderColor: "#d1c5b220",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,                  // Android shadow
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
    borderRadius: 17,              // Perfect circle (half of width/height)
    backgroundColor: "#fcd371",   // Gold background matches primary container
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: "700",
    color: "#775a00",             // Dark gold text on light gold background
  },
  authorName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#121c2c",
    letterSpacing: 0.2,
  },
  authorMeta: {
    fontSize: 10,
    color: "#7f7665",             // Muted for secondary info
    marginTop: 1,
  },
  postImage: {
    width: "100%",
    aspectRatio: 4 / 3,           // Maintains consistent image proportions
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
    borderTopColor: "#d1c5b215",  // Subtle separator above actions
  },
  actionsLeft: {
    flexDirection: "row",
    gap: 16,                      // Space between multiple left-side action icons
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  // ── UI States (loading , error , empty) ─────────────────
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
    backgroundColor: "#fcd371",   // Gold pill button
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#775a00",
  },
  floatingButton: {
    position: "absolute",
    bottom: 96,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  gradientButton: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
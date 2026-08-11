import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllPosts, Post } from "@/services/adoptionService";

// ─── Filters ──────────────────────────────────────────────────────────────────

const FILTERS = ["All", "Dogs", "Cats", "Rabbits", "Birds"];

// ─── Pet Card ─────────────────────────────────────────────────────────────────

function PetCard({
  item,
  onToggleLike,
  onPress,
}: {
  item: Post & { liked: boolean };
  onToggleLike: (id: string) => void;
  onPress: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item._id)}
      activeOpacity={0.92}
    >
      <View style={styles.cardImageWrapper}>
        <Image
          source={{
            uri: item.images?.[0] ?? "https://placedog.net/300/300",
          }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.likeBtn}
          onPress={() => onToggleLike(item._id)}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons
            name={item.liked ? "favorite" : "favorite-border"}
            size={18}
            color={item.liked ? "#ba1a1a" : "#131d21"}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardBreed} numberOfLines={1}>{item.breed}</Text>
        <View style={styles.cardLocation}>
          <MaterialIcons name="location-on" size={13} color="#5c5f60" />
          <Text style={styles.cardLocationText} numberOfLines={1}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AdoptionPostMain() {
  const router = useRouter();

  const [posts, setPosts] = useState<(Post & { liked: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // ── Fetch posts from backend ──────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPosts();
      // add local liked state to each post
      setPosts(data.map((p) => ({ ...p, liked: false })));
    } catch {
      setError("Could not load posts. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ── Like toggle (local only — wire to API later if needed) ────────────────

  const handleToggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === id ? { ...p, liked: !p.liked } : p))
    );
  };

  // ── Navigate to detail screen with real postId ────────────────────────────

  const handlePetPress = (id: string) => {
    router.push(`/adoption-corner/ViewAdoptionPost?postId=${id}`);
  };

  // ── Filter logic (uses category field from API) ───────────────────────────

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      search === "" ||
      post.name.toLowerCase().includes(search.toLowerCase()) ||
      post.breed.toLowerCase().includes(search.toLowerCase()) ||
      post.location.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Dogs" && post.category === "Dog") ||
      (activeFilter === "Cats" && post.category === "Cat") ||
      (activeFilter === "Rabbits" &&
        (post.category === "Other" &&
          post.breed.toLowerCase().includes("rabbit"))) ||
      (activeFilter === "Birds" &&
        (post.category === "Other" &&
          post.breed.toLowerCase().includes("parrot")));

    return matchesSearch && matchesFilter;
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color="#785a00" />
        <Text style={styles.loadingText}>Loading pets...</Text>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <View style={styles.centeredState}>
        <MaterialIcons name="wifi-off" size={48} color="#d2c5af" />
        <Text style={styles.emptyText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchPosts}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <MaterialIcons name="arrow-back" size={24} color="#785a00" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adoption Corner</Text>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#807663" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search anything"
            placeholderTextColor="#b0a895"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.filterIconBtn} activeOpacity={0.8}>
            <MaterialIcons name="tune" size={20} color="#131d21" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filter Chips ── */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Pet Grid ── */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        onRefresh={fetchPosts}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="pets" size={48} color="#d2c5af" />
            <Text style={styles.emptyText}>No pets found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <PetCard
              item={item}
              onToggleLike={handleToggleLike}
              onPress={handlePetPress}
            />
          </View>
        )}
      />

      {/* ── FAB: Add Post ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/adoption-corner/CreateAdoptionPost")}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f1fbff",
  },

  // Centered states (loading / error)
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1fbff",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#807663",
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#785a00",
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 30,
    paddingBottom: 12,
    backgroundColor: "#f1fbff",
    borderBottomWidth: 1,
    borderBottomColor: "#e4f0f4",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eaf5fa",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#785a00",
    letterSpacing: -0.3,
    marginLeft: 70,
  },

  // Search
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#f1fbff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 30,
    height: 48,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginLeft: 14, marginRight: 4 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#131d21",
    height: "100%",
    paddingHorizontal: 4,
  },
  filterIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },

  // Filters
  filtersWrapper: {
    backgroundColor: "#f1fbff",
    paddingBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 30,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d2c5af",
  },
  filterChipActive: {
    backgroundColor: "#f9c74f",
    borderColor: "#f9c74f",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4e4635",
  },
  filterTextActive: {
    color: "#785a00",
    fontWeight: "700",
  },

  // Grid
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardWrapper: {
    width: "48.5%",
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageWrapper: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#e4f0f4",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  likeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(241,251,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    padding: 10,
    gap: 3,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#131d21",
  },
  cardBreed: {
    fontSize: 13,
    color: "#4e4635",
    fontWeight: "400",
  },
  cardLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 3,
  },
  cardLocationText: {
    fontSize: 12,
    color: "#5c5f60",
    fontWeight: "500",
    flex: 1,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#807663",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#b0a895",
    textAlign: "center",
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#785a00",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#785a00",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getAllPosts, Post, toggleLikePost } from "../../services/adoptionService";
import { useAuth } from "../../contexts/AuthContext";
import AdoptionFilter, { AdvancedFilters, EMPTY_FILTERS, matchesAdoptionFilters } from "./AdoptionFilter";

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
            color={item.liked ? "#e63946" : "#062425"}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardBreed} numberOfLines={1}>
          {item.breed}
        </Text>
        <View style={styles.cardLocation}>
          <MaterialIcons name="location-on" size={13} color="#717878" />
          <Text style={styles.cardLocationText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AdoptionPostMain() {
  const router = useRouter();
  const { user } = useAuth();

  const [posts, setPosts] = useState<(Post & { liked: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);

  // ── Fetch posts from backend ──────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPosts();
      // add persistent liked state based on logged in user's ID
      setPosts(
        data.map((p) => ({
          ...p,
          liked: !!(user?._id && p.likes?.some((id) => String(id) === String(user._id))),
        }))
      );
    } catch {
      setError("Could not load posts. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ── Persistent Like Toggle ────────────────────────────────────────────────

  const handleToggleLike = async (id: string) => {
    // Update immediately for responsiveness, then restore the prior state if persistence fails.
    setPosts((prev) =>
      prev.map((p) => (p._id === id ? { ...p, liked: !p.liked } : p))
    );

    try {
      const res = await toggleLikePost(id);
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, liked: res.liked } : p))
      );
    } catch {
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, liked: !p.liked } : p))
      );
    }
  };

  // ── Navigate to detail screen with real postId ────────────────────────────

  const handlePetPress = (id: string) => {
    router.push(`/adoption-corner/ViewAdoptionPost?postId=${id}`);
  };

  // ── Filter logic (uses category field from API) ───────────────────────────

  const filteredPosts = posts.filter((post) =>
    matchesAdoptionFilters(post, search, activeFilter, appliedFilters)
  );

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color="#FEB94B" />
        <Text style={styles.loadingText}>Loading pets...</Text>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <View style={styles.centeredState}>
        <MaterialIcons name="wifi-off" size={48} color="#717878" />
        <Text style={styles.emptyText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchPosts} activeOpacity={0.8}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 12}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#062425" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Adoption Corner</Text>

        {/* Top Create Adoption Post Action */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/adoption-corner/CreateAdoptionPost")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#062425" />
        </TouchableOpacity>
      </View>

      <AdoptionFilter
        search={search}
        activeFilter={activeFilter}
        appliedFilters={appliedFilters}
        onSearchChange={setSearch}
        onActiveFilterChange={setActiveFilter}
        onAppliedFiltersChange={setAppliedFilters}
      />

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
            <MaterialIcons
              name={activeFilter === "Favorites" ? "favorite-border" : "pets"}
              size={48}
              color="#717878"
            />
            <Text style={styles.emptyText}>
              {activeFilter === "Favorites" ? "No favorite pets yet" : "No pets found"}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeFilter === "Favorites"
                ? "Tap the heart on any pet card to add them to your favorites"
                : "Try adjusting your search or filters"}
            </Text>
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
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#faf9f8",
  },

  // Centered states (loading / error)
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#faf9f8",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#717878",
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#F5A623",
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: "#faf9f8",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f4f3f3",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#062425",
    letterSpacing: -0.3,
  },

  // Grid
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 32,
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
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#1e3a3a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardImageWrapper: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f4f3f3",
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
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    padding: 12,
    gap: 4,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#062425",
  },
  cardBreed: {
    fontSize: 13,
    color: "#414848",
    fontWeight: "400",
  },
  cardLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  cardLocationText: {
    fontSize: 12,
    color: "#717878",
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
    color: "#062425",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#717878",
    textAlign: "center",
  },
});

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
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
import { getAllPosts, Post, toggleLikePost } from "../../services/adoptionService";
import { useAuth } from "../../contexts/AuthContext";
import PrimaryButton from "../../components/PrimaryButton";

// ─── Filters ──────────────────────────────────────────────────────────────────

const FILTERS = ["All", "Favorites", "Dogs", "Cats", "Rabbits", "Birds"];
type AdvancedFilters = { animalType: string; gender: string; breed: string; age: string; ageUnit: "" | "Months" | "Years"; location: string };
const EMPTY_FILTERS: AdvancedFilters = { animalType: "", gender: "", breed: "", age: "", ageUnit: "", location: "" };

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
        {item.age ? <Text style={styles.cardAge}>{item.ageValue && item.ageUnit ? `${item.ageValue} ${item.ageUnit}` : item.age}</Text> : null}
        <Text style={styles.cardDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
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
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);
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
          liked: !!(user?._id && p.likes?.some((id: any) => String(id) === String(user._id))),
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
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => (p._id === id ? { ...p, liked: !p.liked } : p))
    );

    try {
      const res = await toggleLikePost(id);
      setPosts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, liked: res.liked } : p))
      );
    } catch (_err) {
      // Revert optimistic update on failure
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

  const filteredPosts = posts.filter((post) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      query === "" ||
      (post.name || "").toLowerCase().includes(query) ||
      (post.breed || "").toLowerCase().includes(query) ||
      (post.location || "").toLowerCase().includes(query);

    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Favorites" && post.liked) ||
      (activeFilter === "Dogs" && (post.category === "Dog" || post.category === "Dogs")) ||
      (activeFilter === "Cats" && (post.category === "Cat" || post.category === "Cats")) ||
      (activeFilter === "Rabbits" &&
        (post.category === "Other" &&
          (post.breed.toLowerCase().includes("rabbit") ||
            (post.customCategory && post.customCategory.toLowerCase().includes("rabbit"))))) ||
      (activeFilter === "Birds" &&
        (post.category === "Other" &&
          (post.breed.toLowerCase().includes("parrot") ||
            post.breed.toLowerCase().includes("bird") ||
            (post.customCategory &&
              (post.customCategory.toLowerCase().includes("bird") ||
                post.customCategory.toLowerCase().includes("parrot"))))));

    const ageValue = post.ageValue ?? Number(post.age?.match(/\d+(?:\.\d+)?/)?.[0] || 0);
    const ageUnit = post.ageUnit ?? (post.age?.toLowerCase().includes("year") ? "Years" : "Months");
    const postAgeMonths = ageUnit === "Years" ? ageValue * 12 : ageValue;
    const filterAgeMonths = appliedFilters.ageUnit === "Years" ? Number(appliedFilters.age) * 12 : Number(appliedFilters.age);
    const matchesAdvanced =
      (!appliedFilters.animalType || post.category === appliedFilters.animalType) &&
      (!appliedFilters.gender || post.gender === appliedFilters.gender) &&
      (!appliedFilters.breed || (post.breed || "").toLowerCase().includes(appliedFilters.breed.toLowerCase())) &&
      (!appliedFilters.location || (post.location || "").toLowerCase().includes(appliedFilters.location.toLowerCase())) &&
      (!appliedFilters.age || (postAgeMonths > 0 && postAgeMonths <= filterAgeMonths));

    return matchesSearch && matchesFilter && matchesAdvanced;
  });

  const filterOptions = {
    animalType: Array.from(new Set(posts.map((post) => post.category).filter(Boolean))),
    gender: Array.from(new Set(posts.map((post) => post.gender).filter(Boolean))),
    breed: Array.from(new Set(posts.map((post) => post.breed).filter(Boolean))).sort(),
  };
  const hasAdvancedFilters = Object.values(appliedFilters).some(Boolean);

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
    <View style={styles.screen}>
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

      {/* ── Search Bar ── */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <MaterialIcons
            name="search"
            size={20}
            color="#717878"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by breed or name..."
            placeholderTextColor="#717878"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={[styles.filterButton, (showFilters || hasAdvancedFilters) && styles.filterButtonActive]} onPress={() => setShowFilters((value) => !value)} accessibilityLabel="Open adoption filters">
          <MaterialIcons name="tune" size={22} color={(showFilters || hasAdvancedFilters) ? "#FFFFFF" : "#D48806"} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterPanel}>
          {(["animalType", "gender", "breed"] as const).map((field) => (
            <View key={field} style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{field === "animalType" ? "Animal type" : field[0].toUpperCase() + field.slice(1)}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterOptions}>
                  {filterOptions[field].map((option) => (
                    <TouchableOpacity key={option} style={[styles.filterOption, draftFilters[field] === option && styles.filterOptionActive]} onPress={() => setDraftFilters((current) => ({ ...current, [field]: current[field] === option ? "" : option }))}>
                      <Text style={[styles.filterOptionText, draftFilters[field] === option && styles.filterOptionTextActive]}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          ))}
          <View style={styles.filterInputsRow}>
            <TextInput style={styles.filterInput} placeholder="Maximum age" keyboardType="decimal-pad" value={draftFilters.age} onChangeText={(age) => setDraftFilters((current) => ({ ...current, age: age.replace(/[^0-9.]/g, "") }))} />
            <TextInput style={styles.filterInput} placeholder="Location" value={draftFilters.location} onChangeText={(location) => setDraftFilters((current) => ({ ...current, location }))} />
          </View>
          <View style={styles.ageUnitFilters}>{(["Months", "Years"] as const).map((unit) => <TouchableOpacity key={unit} style={[styles.filterOption, draftFilters.ageUnit === unit && styles.filterOptionActive]} onPress={() => setDraftFilters((current) => ({ ...current, ageUnit: unit }))}><Text style={[styles.filterOptionText, draftFilters.ageUnit === unit && styles.filterOptionTextActive]}>{unit}</Text></TouchableOpacity>)}</View>
          <Text style={styles.ageHint}>Choose an age unit when filtering by maximum age.</Text>
          <View style={styles.filterActions}>
            <View style={styles.filterAction}><PrimaryButton title="Clear" variant="outline" onPress={() => { setDraftFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); }} /></View>
            <View style={styles.filterAction}><PrimaryButton title="Apply" disabled={Boolean(draftFilters.age && !draftFilters.ageUnit)} onPress={() => { setAppliedFilters(draftFilters); setShowFilters(false); }} /></View>
          </View>
        </View>
      )}

      {/* ── Filter Chips ── */}
      <View style={styles.chipsScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, activeFilter === f && styles.chipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.8}
            >
              {f === "Favorites" && (
                <MaterialIcons
                  name={activeFilter === f ? "favorite" : "favorite-border"}
                  size={14}
                  color={activeFilter === f ? "#fff" : "#D48806"}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text
                style={[
                  styles.chipText,
                  activeFilter === f && styles.chipTextActive,
                ]}
              >
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
    </View>
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

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 16,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f3f3",
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1a1c1c",
    paddingVertical: 14,
  },
  filterButton: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: "#F5A623", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF7E6" },
  filterButtonActive: { backgroundColor: "#F5A623" },
  filterPanel: { marginHorizontal: 20, marginBottom: 14, padding: 14, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E0D6", gap: 10 },
  filterGroup: { gap: 6 },
  filterLabel: { fontSize: 12, fontWeight: "700", color: "#191C1D" },
  filterOptions: { flexDirection: "row", gap: 7 },
  filterOption: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: "#F3F4F5" },
  filterOptionActive: { backgroundColor: "#F5A623" },
  filterOptionText: { fontSize: 12, color: "#717878" },
  filterOptionTextActive: { color: "#FFFFFF", fontWeight: "700" },
  filterInputsRow: { flexDirection: "row", gap: 8 },
  filterInput: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: "#E2E0D6", borderRadius: 10, paddingHorizontal: 12, color: "#191C1D" },
  ageHint: { fontSize: 10, color: "#717878" },
  ageUnitFilters: { flexDirection: "row", gap: 7 },
  filterActions: { flexDirection: "row", gap: 8 },
  filterAction: { flex: 1 },

  // Filter Chips
  chipsScrollWrapper: {
    marginBottom: 16,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsContent: {
    gap: 8,
    paddingHorizontal: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFF7E6",
  },
  chipActive: {
    backgroundColor: "#F5A623",
  },
  chipText: {
    color: "#D48806",
    fontWeight: "600",
    fontSize: 13,
  },
  chipTextActive: {
    color: "#fff",
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
  cardAge: { fontSize: 12, color: "#D48806", fontWeight: "600", marginTop: 2 },
  cardDate: { fontSize: 11, color: "#717878", marginTop: 2 },
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

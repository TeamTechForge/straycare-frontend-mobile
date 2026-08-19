import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import { ANIMAL_BREEDS } from "../../constants/breeds.constants";

// ─── Filters ──────────────────────────────────────────────────────────────────

const FILTERS = ["All", "Favorites", "Dogs", "Cats", "Rabbits", "Birds"];
const ANIMAL_TYPES = ["Dog", "Cat", "Other"];
const GENDERS = ["Male", "Female"];
const AGE_RANGES = ["Any age", "Below 6 months", "6–12 months", "1–3 years", "3–7 years", "Above 7 years"];
const HEALTH_STATUSES = ["Healthy", "Needs Care", "Under Treatment", "Special Needs"];
type AdvancedFilters = { animalType: string; otherAnimalType: string; gender: string; breed: string; customBreed: string; ageRange: string; healthStatus: string; location: string };
const EMPTY_FILTERS: AdvancedFilters = { animalType: "", otherAnimalType: "", gender: "", breed: "", customBreed: "", ageRange: "Any age", healthStatus: "", location: "" };

const ageInMonths = (age?: string) => {
  const match = age?.trim().match(/(\d+(?:\.\d+)?)\s*(year|years|month|months|week|weeks)?/i);
  if (!match) return null;
  const value = Number(match[1]);
  const unit = (match[2] || "months").toLowerCase();
  if (unit.startsWith("year")) return value * 12;
  if (unit.startsWith("week")) return value / 4.345;
  return value;
};

const matchesAgeRange = (age: string | undefined, range: string) => {
  if (!range || range === "Any age") return true;
  const months = ageInMonths(age);
  if (months === null) return false;
  if (range === "Below 6 months") return months < 6;
  if (range === "6–12 months") return months >= 6 && months <= 12;
  if (range === "1–3 years") return months >= 12 && months <= 36;
  if (range === "3–7 years") return months > 36 && months <= 84;
  return months > 84;
};

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
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);
  const [openFilter, setOpenFilter] = useState<keyof AdvancedFilters | null>(null);
  const filterScrollRef = useRef<ScrollView>(null);

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

    const matchesAdvanced =
      (!appliedFilters.animalType || post.category === appliedFilters.animalType) &&
      (!appliedFilters.otherAnimalType || `${post.customCategory || ""} ${post.breed || ""}`.toLowerCase().includes(appliedFilters.otherAnimalType.trim().toLowerCase())) &&
      (!appliedFilters.gender || post.gender === appliedFilters.gender) &&
      (!appliedFilters.breed || (appliedFilters.breed === "Other"
        ? (!appliedFilters.customBreed || (post.breed || "").toLowerCase().includes(appliedFilters.customBreed.trim().toLowerCase()))
        : post.breed === appliedFilters.breed)) &&
      matchesAgeRange(post.age, appliedFilters.ageRange) &&
      (!appliedFilters.healthStatus || post.healthStatus === appliedFilters.healthStatus) &&
      (!appliedFilters.location || (post.location || "").toLowerCase().includes(appliedFilters.location.trim().toLowerCase()));

    return matchesSearch && matchesFilter && matchesAdvanced;
  });

  const hasAdvancedFilters = Boolean(appliedFilters.animalType || appliedFilters.otherAnimalType || appliedFilters.gender || appliedFilters.breed || appliedFilters.customBreed || appliedFilters.healthStatus || appliedFilters.location || appliedFilters.ageRange !== "Any age");
  const availableBreeds = draftFilters.animalType === "Dog"
    ? ANIMAL_BREEDS.Dog.filter((breed) => breed !== "Unknown Breed")
    : draftFilters.animalType === "Cat"
      ? ANIMAL_BREEDS.Cat.filter((breed) => breed !== "Unknown")
      : [];
  const filterFields: { key: keyof AdvancedFilters; label: string; options: string[] }[] = [
    { key: "animalType", label: "Animal type", options: ANIMAL_TYPES },
    { key: "gender", label: "Gender", options: GENDERS },
    ...(draftFilters.animalType !== "Other" ? [{ key: "breed" as keyof AdvancedFilters, label: "Breed", options: availableBreeds }] : []),
    { key: "ageRange", label: "Age", options: AGE_RANGES },
    { key: "healthStatus", label: "Health status", options: HEALTH_STATUSES },
  ];

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
        <ScrollView ref={filterScrollRef} style={styles.filterPanel} contentContainerStyle={styles.filterPanelContent} keyboardShouldPersistTaps="handled" nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {filterFields.map(({ key, label, options }) => (
            <View key={key} style={styles.filterGroup}>
              <Text style={styles.filterLabel}>{label}</Text>
              <TouchableOpacity disabled={key === "breed" && (!draftFilters.animalType || draftFilters.animalType === "Other")} style={[styles.filterSelect, key === "breed" && (!draftFilters.animalType || draftFilters.animalType === "Other") && styles.filterSelectDisabled]} onPress={() => setOpenFilter((current) => current === key ? null : key)}>
                <Text style={draftFilters[key] ? styles.filterSelectText : styles.filterPlaceholder}>{draftFilters[key] || (key === "breed" && !draftFilters.animalType ? "Select animal type first" : key === "breed" && draftFilters.animalType === "Other" ? "Not applicable for Other" : `Select ${label.toLowerCase()}`)}</Text>
                <Ionicons name={openFilter === key ? "chevron-up" : "chevron-down"} size={17} color="#717878" />
              </TouchableOpacity>
              {openFilter === key && (
                <ScrollView style={styles.filterDropdown} nestedScrollEnabled>
                  {options.map((option) => (
                    <TouchableOpacity key={option} style={[styles.filterDropdownItem, draftFilters[key] === option && styles.filterDropdownItemActive]} onPress={() => { setDraftFilters((current) => key === "animalType" ? { ...current, animalType: option, breed: "", customBreed: "", otherAnimalType: "" } : key === "breed" ? { ...current, breed: option, customBreed: "" } : { ...current, [key]: option }); setOpenFilter(null); }}>
                      <Text style={styles.filterDropdownText}>{option}</Text>
                      {draftFilters[key] === option && <Ionicons name="checkmark" size={17} color="#D48806" />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {key === "animalType" && draftFilters.animalType === "Other" && (
                <View style={styles.inlineConditionalField}>
                  <Text style={styles.filterLabel}>Specify animal type</Text>
                  <TextInput style={styles.locationFilterInput} placeholder="e.g. Rabbit, Bird or Turtle" placeholderTextColor="#A8A497" value={draftFilters.otherAnimalType} onChangeText={(otherAnimalType) => setDraftFilters((current) => ({ ...current, otherAnimalType }))} />
                </View>
              )}
              {key === "breed" && draftFilters.breed === "Other" && (
                <View style={styles.inlineConditionalField}>
                  <Text style={styles.filterLabel}>Specify breed</Text>
                  <TextInput style={styles.locationFilterInput} placeholder="Type the breed" placeholderTextColor="#A8A497" value={draftFilters.customBreed} onChangeText={(customBreed) => setDraftFilters((current) => ({ ...current, customBreed }))} />
                  {!draftFilters.customBreed.trim() && <Text style={styles.filterHelp}>Enter a breed to apply this filter.</Text>}
                </View>
              )}
            </View>
          ))}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Location</Text>
            <TextInput style={styles.locationFilterInput} placeholder="Type a city or area" placeholderTextColor="#A8A497" value={draftFilters.location} onFocus={() => setTimeout(() => filterScrollRef.current?.scrollToEnd({ animated: true }), 250)} onChangeText={(location) => setDraftFilters((current) => ({ ...current, location }))} />
          </View>
          <View style={styles.filterActions}>
            <View style={styles.filterAction}><PrimaryButton title="Clear" variant="outline" onPress={() => { setDraftFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS); setOpenFilter(null); }} /></View>
            <View style={styles.filterAction}><PrimaryButton title="Apply" disabled={draftFilters.breed === "Other" && !draftFilters.customBreed.trim()} onPress={() => { setAppliedFilters(draftFilters); setShowFilters(false); setOpenFilter(null); }} /></View>
          </View>
        </ScrollView>
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
  filterPanel: { marginHorizontal: 20, marginBottom: 14, maxHeight:800, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E2E0D6" },
  filterPanelContent: { padding: 14, gap: 10 },
  filterGroup: { gap: 6 },
  inlineConditionalField: { gap: 6, marginTop: 4 },
  filterLabel: { fontSize: 12, fontWeight: "700", color: "#191C1D" },
  filterSelect: { minHeight: 44, borderWidth: 1, borderColor: "#E2E0D6", borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#F8F9FA", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  filterSelectDisabled: { opacity: 0.55 },
  filterSelectText: { flex: 1, fontSize: 13, color: "#191C1D" },
  filterPlaceholder: { flex: 1, fontSize: 13, color: "#A8A497" },
  filterDropdown: { maxHeight: 180, borderWidth: 1, borderColor: "#E2E0D6", borderRadius: 10, backgroundColor: "#FFFFFF" },
  filterDropdownItem: { minHeight: 42, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E2E0D6" },
  filterDropdownItemActive: { backgroundColor: "#FFF7E6" },
  filterDropdownText: { fontSize: 13, color: "#191C1D" },
  locationFilterInput: { minHeight: 44, borderWidth: 1, borderColor: "#E2E0D6", borderRadius: 10, paddingHorizontal: 12, backgroundColor: "#F8F9FA", color: "#191C1D", fontSize: 13 },
  filterHelp: { color: "#B00020", fontSize: 11 },
  filterOptions: { flexDirection: "row", gap: 7 },
  filterOption: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, backgroundColor: "#F3F4F5" },
  filterOptionActive: { backgroundColor: "#F5A623" },
  filterOptionText: { fontSize: 12, color: "#717878" },
  filterOptionTextActive: { color: "#FFFFFF", fontWeight: "700" },
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

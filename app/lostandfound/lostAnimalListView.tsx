import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getLostPosts } from "../../api/api";

type Pet = {
  _id: string;
  type: string;
  breed: string;
  name: string;
  description: string;
  location: string;
  time: string;
  images: string[];
};

export default function LostAnimalScreen() {
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [pets, setPets] = useState<Pet[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchLostPosts();
  }, []);

  const fetchLostPosts = async () => {
    try {
      const response = await getLostPosts();
      setPets(response.data || response || []);
    } catch (error) {
      console.log("Error fetching posts:", error);
      setPets([]);
    }
  };

  const filteredPets = (pets || []).filter((pet) => {
    const matchesFilter = filter === "All" || pet.type === filter;
    const matchesSearch =
      search === "" ||
      pet.breed?.toLowerCase().includes(search.toLowerCase()) ||
      pet.name?.toLowerCase().includes(search.toLowerCase()) ||
      pet.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const FILTERS = ["All", "Dog", "Cat", "Other"];

  const renderPet = ({ item }: { item: Pet }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => router.push(`/lostAndFound/viewLostFoundPost?id=${item._id}`)}
    >
      <Image source={{ uri: item.images?.[0] }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        {/* Badge */}
        <View style={styles.badgeRow}>
          <View style={styles.lostBadge}>
            <Text style={styles.lostBadgeText}>LOST</Text>
          </View>
        </View>

        {/* Breed / Name */}
        <Text style={styles.cardTitle}>
          {item.breed}
          {item.name !== "Unknown" ? ` - ${item.name}` : ""}
        </Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <MaterialIcons name="location-on" size={15} color="#717878" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>

        {/* Description */}
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>

      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#062425" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/lostAndFound/createLostFoundPost")}
        >
          <Ionicons name="add" size={24} color="#062425" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPets}
        renderItem={renderPet}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Help Bring{"\n"}Them Home</Text>
              <Text style={styles.heroSub}>
                Help us find our missing furry friends.
              </Text>
            </View>

            {/* Search + Filter icon row */}
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
                  placeholder="Search by name or breed..."
                  placeholderTextColor="#717878"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <TouchableOpacity style={styles.tuneBtn}>
                <MaterialIcons name="tune" size={22} color="#062425" />
              </TouchableOpacity>
            </View>

            {/* Category chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsContent}
            >
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, filter === f && styles.chipActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      filter === f && styles.chipTextActive,
                    ]}
                  >
                    {f === "All" ? "All Pets" : `${f}s`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf9f8",
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: "#faf9f8",
    borderBottomWidth: 1,
    borderBottomColor: "#faf9f8",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f3f3",
  },

  /* ── List padding ── */
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  /* ── Hero ── */
  hero: {
    marginTop: 28,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#062425",
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 16,
    color: "#414848",
    fontWeight: "400",
  },

  /* ── Search row ── */
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f3f3",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
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
  tuneBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#f4f3f3",
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Chips ── */
  chipsScroll: {
    marginBottom: 20,
  },
  chipsContent: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "#e9e8e7",
  },
  chipActive: {
    backgroundColor: "#062425",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#414848",
  },
  chipTextActive: {
    color: "#fff",
  },

  /* ── Card ── */
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#1e3a3a",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: "#e9e8e7",
  },
  cardBody: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  lostBadge: {
    backgroundColor: "#fff3eb",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  lostBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9b4500",
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#062425",
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: "#414848",
    marginLeft: 2,
  },
  cardDescription: {
    fontSize: 13,
    color: "#414848",
    lineHeight: 19,
    marginBottom: 14,
  },
});
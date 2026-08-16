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
import { AnimalPost } from "../../services/lostAndFoundService";

interface BaseAnimalListViewProps {
  mode: "lost" | "found";
  fetchPostsFn: () => Promise<AnimalPost[]>;
  badgeLabel: string;
  badgeTextColor: string;
  badgeBgColor: string;
}

export default function BaseAnimalListView({
  fetchPostsFn,
  badgeLabel,
  badgeTextColor,
  badgeBgColor,
}: BaseAnimalListViewProps) {
  const router = useRouter();

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [pets, setPets] = useState<AnimalPost[]>([]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const response = await fetchPostsFn();
      const payload = Array.isArray(response) ? response : (response as any)?.data ?? [];
      setPets(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.log("Error fetching posts:", error);
      setPets([]);
    }
  };

  const formatType = (value?: string) => {
    const normalized = (value || "").toLowerCase();
    if (normalized === "dog") return "Dog";
    if (normalized === "cat") return "Cat";
    return "Other";
  };

  const getDisplayDate = (pet: AnimalPost) => {
    return pet.date || pet.createdAt || "Recently Posted";
  };

  const filteredPets = pets.filter((pet) => {
    const matchesFilter =
      filter === "All" ||
      formatType(pet.type).toLowerCase() === filter.toLowerCase();

    const text = `${pet.breed || ""} ${pet.name || ""} ${
      pet.description || ""
    }`.toLowerCase();

    const matchesSearch =
      search === "" || text.includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const FILTERS = ["All", "Dog", "Cat", "Other"];

  const renderPet = ({ item }: { item: AnimalPost }) => {
    const imageUri =
      item.imageUrl ||
      (item.images && item.images.length > 0
        ? item.images[0]
        : "https://placehold.co/600x400/png");

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/lost-and-found/ViewLostFoundPost",
            params: { id: item._id },
          })
        }
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.cardImage}
        />

        <View style={styles.cardBody}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
              <Text style={[styles.badgeText, { color: badgeTextColor }]}>
                {badgeLabel}
              </Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>
            {item.breed || "Unknown"}
            {item.name && item.name !== "Unknown" ? ` - ${item.name}` : ""}
          </Text>

          <View style={styles.locationRow}>
            <MaterialIcons
              name="location-on"
              size={15}
              color="#717878"
            />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>

          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 12, color: "#717878" }}>
              {getDisplayDate(item)}
            </Text>

            <View
              style={{
                backgroundColor:
                  formatType(item.type) === "Dog" ? "#F5A623" : "#ffb700",
                paddingHorizontal: 12,
                paddingVertical: 5,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: 11,
                }}
              >
                {formatType(item.type)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#062425" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/lost-and-found/CreateLostFoundPost")}
        >
          <Ionicons name="add" size={24} color="#062425" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPets}
        renderItem={renderPet}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>
                Help Bring{"\n"}Them Home
              </Text>

              <Text style={styles.heroSub}>
                Help us find our missing furry friends.
              </Text>
            </View>

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
            </View>

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
    backgroundColor: "#f4f3f3",
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
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
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  chipsScroll: {
    marginBottom: 20,
  },
  chipsContent: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 20,
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 18,
    shadowColor: "#1e3a3a",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: "#ececec",
  },
  cardBody: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "#fff3eb",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#062425",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    marginLeft: 4,
    color: "#414848",
    fontSize: 13,
  },
  cardDescription: {
    color: "#414848",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
});

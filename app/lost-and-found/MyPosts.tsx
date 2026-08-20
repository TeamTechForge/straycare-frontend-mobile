import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AnimalPost, getMyAnimalPosts } from "../../services/lostAndFoundService";
import { useAuth } from "../../contexts/AuthContext";
import BackButton from "../../components/BackButton";
import { getAnimalPostTitle } from "../../utils/lostAndFoundDisplay";

export default function MyPostsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [pets, setPets] = useState<AnimalPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) {
      loadPosts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await getMyAnimalPosts(user!._id);
      const payload = Array.isArray(response) ? response : (response as any)?.data ?? [];
      setPets(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.log("Error fetching my posts:", error);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const formatType = (value?: string) => {
    const normalized = (value || "").toLowerCase();
    if (normalized === "dog") return "Dog";
    if (normalized === "cat") return "Cat";
    return "Other";
  };

  const getDisplayDate = (pet: AnimalPost) => {
    if (!pet.createdAt) return "Recently Posted";

    const createdDate = new Date(pet.createdAt);
    return Number.isNaN(createdDate.getTime())
      ? "Recently Posted"
      : createdDate.toLocaleDateString();
  };

  const renderPet = ({ item }: { item: AnimalPost }) => {
    const postTitle = getAnimalPostTitle(item.breed, item.name);
    const animalType = formatType(item.type);
    const imageUri =
      item.imageUrl ||
      (item.images && item.images.length > 0
        ? item.images[0]
        : "https://placehold.co/600x400/png");
        
    const badgeLabel = item.status === "lost" ? "LOST" : "FOUND";
    const badgeTextColor = "#F5A623";
    const badgeBgColor = "#FFF7E6";

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() =>
            router.push({
              pathname: "/lost-and-found/ViewLostFoundPost",
              params: { id: item._id },
            })
          }
        >
          <Image source={{ uri: imageUri }} style={styles.cardImage} />

          <View style={styles.cardBody}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: badgeBgColor }]}>
                <Text style={[styles.badgeText, { color: badgeTextColor }]}>
                  {badgeLabel}
                </Text>
              </View>
            </View>

            {postTitle ? <Text style={styles.cardTitle}>{postTitle}</Text> : null}

            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={15} color="#717878" />
              <Text style={styles.locationText}>{item.location}</Text>
            </View>

            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: "#717878" }}>{getDisplayDate(item)}</Text>
              <View
                style={{
                  backgroundColor: animalType === "Dog" ? "#F5A623" : "#ffb700",
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 11 }}>
                  {animalType}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>My Posts</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text>Loading your posts...</Text>
        </View>
      ) : pets.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>You haven't reported any lost or found pets yet.</Text>
        </View>
      ) : (
        <FlatList
          data={pets}
          renderItem={renderPet}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#062425",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f4f3f3",
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#717878",
    fontSize: 15,
    textAlign: "center",
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
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
    padding: 12,
    justifyContent: "flex-end",
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editBtn: {
    backgroundColor: "#f4f3f3",
  },
  deleteBtn: {
    backgroundColor: "#FFF0F0",
  },
  editText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#062425",
  },
  deleteText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF5A5A",
  },
});

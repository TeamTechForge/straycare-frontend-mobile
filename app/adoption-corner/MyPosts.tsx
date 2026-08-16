import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getMyPosts, Post } from "../../services/adoptionService";
import { useAuth } from "../../contexts/AuthContext";

const C = {
  bg: "#F8F9FA",
  surface: "#FFFFFF",
  surfaceLow: "#F3F4F5",
  primary: "#F5A623",
  primaryContainer: "#FFF7E6",
  onPrimaryContainer: "#D48806",
  outline: "#E2E0D6",
  textMain: "#191C1D",
  textSub: "#717878",
  textPlaceholder: "#A8A497",
  error: "#B00020",
  errorBg: "#FFF0F0",
};

export default function MyAdoptionPostsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = async () => {
    try {
      const data = await getMyPosts();
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Error fetching my adoption posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [user?._id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const getDisplayDate = (post: Post) => {
    if (post.createdAt) {
      try {
        const d = new Date(post.createdAt);
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      } catch {
        return "Recently Posted";
      }
    }
    return "Recently Posted";
  };

  const renderItem = ({ item }: { item: Post }) => {
    const imageUri =
      item.images && item.images.length > 0
        ? item.images[0]
        : "https://placehold.co/600x400/png";

    const isAvailable = item.status === "Available";
    const isAdopted = item.status === "Adopted";

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push(`/adoption-corner/ViewAdoptionPost?postId=${item._id}`)
          }
        >
          <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />

          <View style={styles.cardBody}>
            {/* Top row: Status Badge & Category pill */}
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.statusBadge,
                  isAdopted
                    ? styles.statusAdopted
                    : isAvailable
                    ? styles.statusAvailable
                    : styles.statusPending,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isAdopted
                      ? styles.statusTextAdopted
                      : isAvailable
                      ? styles.statusTextAvailable
                      : styles.statusTextPending,
                  ]}
                >
                  {item.status.toUpperCase()}
                </Text>
              </View>

              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{item.category}</Text>
              </View>
            </View>

            {/* Pet Name & Breed */}
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.breedText}>
              {item.breed}
              {item.customCategory ? ` (${item.customCategory})` : ""}
              {item.age ? ` • ${item.age}` : ""}
              {item.gender ? ` • ${item.gender}` : ""}
            </Text>

            {/* Location */}
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={15} color={C.textSub} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>

            {/* Description */}
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>

            {/* Date */}
            <Text style={styles.dateText}>{getDisplayDate(item)}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header (No top plus button, clean layout) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={C.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Adoption Posts</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Loading your adoption posts...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <MaterialIcons name="pets" size={40} color={C.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Adoption Posts</Text>
          <Text style={styles.emptySubtitle}>
            You haven't listed any pets for adoption yet.
          </Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/adoption-corner/CreateAdoptionPost")}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color="#000" />
            <Text style={styles.createBtnText}>Create Adoption Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: C.outline,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.textMain,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surfaceLow,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: C.textSub,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textMain,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.textSub,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.outline,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: C.surfaceLow,
  },
  cardBody: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusAvailable: {
    backgroundColor: "#E8F5E9",
  },
  statusPending: {
    backgroundColor: C.primaryContainer,
  },
  statusAdopted: {
    backgroundColor: "#E0F2FE",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusTextAvailable: {
    color: "#2E7D32",
  },
  statusTextPending: {
    color: C.onPrimaryContainer,
  },
  statusTextAdopted: {
    color: "#0284C7",
  },
  categoryPill: {
    backgroundColor: C.surfaceLow,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: C.textSub,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.textMain,
    marginBottom: 4,
  },
  breedText: {
    fontSize: 13,
    color: C.textSub,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: C.textSub,
    flex: 1,
  },
  cardDescription: {
    fontSize: 13,
    color: C.textSub,
    lineHeight: 18,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 11,
    color: C.textPlaceholder,
  },
});

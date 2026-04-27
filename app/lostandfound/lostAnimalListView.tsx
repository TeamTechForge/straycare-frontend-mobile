import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getLostPosts } from "../../api/api";

type Pet = {
  _id: string; 
  type: string;
  breed: string;
  name: string;
  description: string;
  location: string;
  time: string;
  image: string; 
};

export default function LostAnimalScreen() {
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [pets, setPets] = useState<Pet[]>([]);
  const router = useRouter();

  //FETCH FROM BACKEND
  useEffect(() => {
    fetchLostPosts();
  }, []);

  const fetchLostPosts = async () => {
  try {
    const response = await getLostPosts();
    console.log("API RESPONSE:", response.data); 
    setPets(response.data); 
  } catch (error) {
    console.log("Error fetching posts:", error);
  }
};
  const filteredPets = pets.filter((pet) => {
    const matchesFilter = filter === "All" || pet.type === filter;
    const matchesSearch =
      search === "" ||
      pet.breed.toLowerCase().includes(search.toLowerCase()) ||
      pet.name.toLowerCase().includes(search.toLowerCase()) ||
      pet.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderPet = ({ item }: { item: Pet }) => (
    <View style={styles.card}>
      {/* IMAGE FROM BACKEND */}
    <Image source={{ uri: item.image?.[0] }} style={styles.image} /> 
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {item.breed} {item.name !== "Unknown" ? `- ${item.name}` : ""}
          </Text>

          <View style={[styles.badge, { backgroundColor: item.type === "Dog" ? "#F5A623" : "#ffb700" }]}>
            <Text style={styles.badgeText}>{item.type}</Text>
          </View>
        </View>

        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.metaRow}>
          <MaterialIcons name="location-on" size={14} color="#F5A623" />
          <Text style={styles.meta}>{item.location}</Text>
        </View>

        <View style={styles.metaRow}>
          <MaterialIcons name="access-time" size={14} color="#F5A623" />
          <Text style={styles.meta}>{item.time}</Text>
        </View>

        <TouchableOpacity style={styles.contactBtn}>
          <MaterialIcons name="phone" size={16} color="#fff" />
          <Text style={styles.contactText}>Contact Owner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Lost Animal</Text>

        {/* ✅ ADDED PLUS BUTTON */}
        <TouchableOpacity onPress={() => router.push("/lostandfound/createPost")}>
          <Ionicons name="add" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search by breed, name..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      {/* Filters */}
      <View style={styles.filters}>
        {["All", "Dog", "Cat", "Other"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={filter === f ? styles.filterTextActive : styles.filterText}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredPets}
        renderItem={renderPet}
        keyExtractor={(item) => item._id} // ✅ changed
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfbf8",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  searchBar: {
    borderWidth: 1,
    borderColor: "#b9b6ad",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#333",
  },
  filters: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 10,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#b8b19f",
    borderWidth: 0,
  },
  filterActive: {
    backgroundColor: "#F5A623",
    borderWidth: 0,
  },
  filterText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  image: {
    width: 110,
    height: 110,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: "#f0f0f0",
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 11,
  },
  description: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  meta: {
    fontSize: 12,
    color: "#888",
  },
  contactBtn: {
    marginTop: 10,
    backgroundColor: "#F5A623",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
});

import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Pet = {
  id: number;
  type: string;
  breed: string;
  name: string;
  description: string;
  location: string;
  time: string;
  image: any;
};

const samplePets: Pet[] = [
  {
    id: 1,
    type: "Dog",
    breed: "Golden Retriever",
    name: "Buddy",
    description: "Found near the river. Has a blue collar and responds to his name.",
    location: "Brooklyn, NY",
    time: "1h ago",
    image: require("../../assets/images/Dog_(128484081).jpeg"),
  },
  {
    id: 2,
    type: "Cat",
    breed: "Tabby Cat",
    name: "Luna",
    description: "Found around the cafe. Very friendly and appears well cared for.",
    location: "Queens, NY",
    time: "3h ago",
    image: require("../../assets/images/cat main.jpeg"),
  },
  {
    id: 3,
    type: "Dog",
    breed: "Husky",
    name: "Snow",
    description: "Found wandering on 5th Avenue. Energetic and playful.",
    location: "Manhattan, NY",
    time: "4h ago",
    image: require("../../assets/images/happy-pet-dogs-playing-park_1359-280.avif"),
  },
  {
    id: 4,
    type: "Cat",
    breed: "Siamese",
    name: "Milo",
    description: "Found near a park with a white patch on the chest.",
    location: "Bronx, NY",
    time: "6h ago",
    image: require("../../assets/images/download (4).jpg"),
  },
];

export default function FoundAnimalView() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState<string>("");

  const filteredPets = samplePets.filter((pet) => {
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
      <Image source={item.image} style={styles.image} />
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
          <Text style={styles.contactText}>Contact Finder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Found Animals</Text>
        <View style={{ width: 28 }} />
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Search by breed, name..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filters}>
        {['All', 'Dog', 'Cat', 'Other'].map((f) => (
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

      <FlatList
        data={filteredPets}
        renderItem={renderPet}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={true}
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
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  description: {
    color: "#555",
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  meta: {
    color: "#555",
    fontSize: 12,
  },
  contactBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5A623",
    paddingVertical: 10,
    borderRadius: 12,
  },
  contactText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
  },
});

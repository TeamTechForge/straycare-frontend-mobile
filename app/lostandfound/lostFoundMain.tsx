import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import API from "../../api/api";

const catImage = require("../../assets/images/cat main.jpeg");
const dogImage = require("../../assets/images/dog main.webp");

export default function LostAndFound() {
  const router = useRouter();

  // State for backend data
  const [lostAnimals, setLostAnimals] = useState([]);
  const [foundAnimals, setFoundAnimals] = useState([]);

  // Fetch data when screen loads
  useEffect(() => {
    fetchLostAnimals();
    fetchFoundAnimals();
  }, []);

  // Get Lost Animals
  const fetchLostAnimals = async () => {
    try {
      const res = await API.get("/api/lost");
      setLostAnimals(res.data);
    } catch (error) {
      console.log("Lost fetch error:", error);
    }
  };

  // Get Found Animals
  const fetchFoundAnimals = async () => {
    try {
      const res = await API.get("/api/found");
      setFoundAnimals(res.data);
    } catch (error) {
      console.log("Found fetch error:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Lost & Found</Text>
        <TouchableOpacity onPress={() => router.push('/lostandfound/createPost')}>
          <Ionicons name="add" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Help reunite animals with their families
      </Text>

      {/* Lost Card */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#fff3e0" }]}
        onPress={() => router.push("/lostandfound/lostanimalview")}
      >
        <Image source={catImage} style={styles.image} />
        <Text style={styles.cardTitle}>Lost Animals</Text>
        <Text style={styles.cardText}>
          View or report animals that are missing
        </Text>
        <MaterialIcons name="search" size={26} color="#FFA500" />

        {/* optional: show count */}
        <Text style={{ marginTop: 5, color: "#555" }}>
          Total: {lostAnimals.length}
        </Text>
      </TouchableOpacity>

      {/* Found Card */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#e8f5e9" }]}
        onPress={() => router.push("/lostandfound/foundAnimalView")}
      >
        <Image source={dogImage} style={styles.image} />
        <Text style={styles.cardTitle}>Found Animals</Text>
        <Text style={styles.cardText}>
          View or report animals that have been found
        </Text>
        <MaterialIcons name="add" size={26} color="#13EC13" />

        {/*optional: show count */}
        <Text style={{ marginTop: 5, color: "#555" }}>
          Total: {foundAnimals.length}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Styles 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8f6",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginVertical: 12,
    color: "#555",
  },
  card: {
    marginTop: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cardText: {
    textAlign: "center",
    color: "#555",
    marginBottom: 10,
  },
 });
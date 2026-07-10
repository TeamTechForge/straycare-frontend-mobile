
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const catImage = require("../../assets/images/cat main.jpeg");
const dogImage = require("../../assets/images/dog main.webp");

export default function LostAndFound() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>Lost & Found</Text>
        <View style={{ width: 28 }} />
      </View>

      <Text style={styles.subtitle}>
        Help reunite animals with their families
      </Text>

      {/* Lost Card */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: "#fff3e0" }]}
        onPress={() => router.push("/lostAndFound/lostAnimalListView")}
      > 
        <Image
          source={catImage}
          style={styles.image}
        />
        <Text style={styles.cardTitle}>Lost Animals</Text>
        <Text style={styles.cardText}>
          View or report animals that are missing
        </Text>
        <MaterialIcons name="search" size={26} color="#FFA500" />
      </TouchableOpacity>

      {/* Found Card */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: "#e8f5e9" }]}
        onPress={() => router.push("/lostAndFound/foundAnimalListView")}
      >
        <Image
          source={dogImage}
          style={styles.image}
        />
        <Text style={styles.cardTitle}>Found Animals</Text>
        <Text style={styles.cardText}>
          View or report animals that have been found
        </Text>
        <MaterialIcons name="add" size={26} color="#13EC13" />
      </TouchableOpacity>
    </View>
  );
}

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


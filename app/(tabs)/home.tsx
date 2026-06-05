import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/straycarelogo.png")}
          style={styles.logo}
        />

        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* GREETING */}
      <Text style={styles.greeting}>
        Hello, User 👋{"\n"}
        <Text style={styles.greetingSub}>
          Together we can save more stray animals 🐾
        </Text>
      </Text>

      {/* ABOUT CARD */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>About Us</Text>
        <View style={styles.aboutBox}>
          <Text style={styles.aboutText}>
            StrayCare is a mobile platform dedicated to rescuing, caring for,
            and finding homes for street animals in your area.
          </Text>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <Feather name="search" size={18} color="#888" />
        <TextInput
          placeholder="Search for Vets/Shelters"
          style={styles.searchInput}
        />
      </View>

      {/* QUICK ACTIONS */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.grid}>
        <ActionCard
          icon={<MaterialCommunityIcons name="hand-heart" size={24} color="#F5A623" />}
          label="Donate"
          onPress={() => router.push("/donate")}
        />

        <ActionCard
          icon={<MaterialCommunityIcons name="dog" size={24} color="#F5A623" />}
          label="Report a Case"
          onPress={() => router.push("/reporting")}
        />

        <ActionCard
          icon={<MaterialCommunityIcons name="paw" size={24} color="#F5A623" />}
          label="Adopt a Pet"
        />

        <ActionCard
          icon={<Feather name="search" size={24} color="#F5A623" />}
          label="Lost & Found"
          onPress={() => router.push("/lostandfound")}
        />
      </View>
    </View>
  );
}

function ActionCard({ icon, label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconCircle}>{icon}</View>
      <Text style={styles.cardText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F4",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    position: "relative",
  },
  notificationIcon: {
    position: "absolute",
    right: 0,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  greeting: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },
  greetingSub: {
    fontWeight: "400",
  },
  aboutCard: {
    marginBottom: 20,
  },
  aboutTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  aboutBox: {
    backgroundColor: "#EED7B5",
    padding: 15,
    borderRadius: 10,
  },
  aboutText: {
    fontSize: 13,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E5E5",
    paddingHorizontal: 12,
    borderRadius: 25,
    height: 45,
    marginBottom: 20,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 15,
    elevation: 2,
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: "#FFF4E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
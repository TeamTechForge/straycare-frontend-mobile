import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const dogImage = require("../../assets/images/dog main.webp");
const catImage = require("../../assets/images/cat main.jpeg");

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Ionicons name="chevron-back" size={24} color="#0f3a3a" />
        </Pressable>

        {/* PLUS BUTTON (NEW) */}
        <Pressable
          onPress={() => router.push("/lostAndFound/createLostFoundPost")}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Ionicons name="add" size={24} color="#0f3a3a" />
        </Pressable>
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>
          <Text style={styles.heroHighlight}>Reuniting</Text>
          {" pets with\ntheir families."}
        </Text>
        <Text style={styles.heroSubtitle}>
          We're here to help you every step of the way.
        </Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        {/* Lost Pet Card */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
          onPress={() => router.push("/lostAndFound/lostAnimalListView")}
        >
          <View style={styles.imageContainer}>
            <Image source={dogImage} style={styles.cardImage} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.62)"]}
              style={styles.gradient}
            />
            <View style={styles.cardOverlay}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Urgent help needed</Text>
              </View>
              <Text style={styles.cardTitle}>I Lost a Pet</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardDescription}>
              Create a missing pet alert for the community.
            </Text>
          </View>
        </Pressable>

        {/* Found Pet Card */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
          onPress={() => router.push("/lostAndFound/foundAnimalListView")}
        >
          <View style={styles.imageContainer}>
            <Image source={catImage} style={styles.cardImage} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.62)"]}
              style={styles.gradient}
            />
            <View style={styles.cardOverlay}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Compassionate care</Text>
              </View>
              <Text style={styles.cardTitle}>I Found a Pet</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardDescription}>
              Report a found animal and help it get home.
            </Text>
            <View style={styles.chevronContainer}>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#0f3a3a"
                style={{ opacity: 0.35 }}
              />
            </View>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const CARD_IMAGE_HEIGHT = 160; // reduced for better text visibility
const CARD_RADIUS = 28;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fdfdfd",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 50,
  },
  backButtonPressed: {
    backgroundColor: "#f0f0f0",
  },

  // Hero
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f3a3a",
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  heroHighlight: {
    color: "#f97316",
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 240,
  },

  // Cards
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    flex: 1,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.18,
    elevation: 6,
  },

  imageContainer: {
    height: CARD_IMAGE_HEIGHT,
    width: "100%",
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100, // fixed gradient
  },
  cardOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(255,255,255,0.32)",
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },

  cardBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardDescription: {
    color: "rgba(15,58,58,0.75)",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  chevronContainer: {
    marginLeft: 8,
  },
});
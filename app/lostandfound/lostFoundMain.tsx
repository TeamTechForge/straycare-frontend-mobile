// LostAndFound Home Screen

import { Ionicons } from "@expo/vector-icons";         // Icon library for back/add/chevron icons
import { LinearGradient } from "expo-linear-gradient"; // Gradient overlay on card images
import { useRouter } from "expo-router";               // Navigation hook for routing between screens
import React from "react";
import {
  Dimensions,    // Gets device screen dimensions
  Image,         // Renders local or remote images
  Pressable,     // Touchable component with press feedback
  SafeAreaView,  // Keeps content within safe screen boundaries (notch, status bar, etc.)
  StyleSheet,    // Creates optimized style objects
  Text,
  View,
} from "react-native";

// Get the device's screen width
const { width } = Dimensions.get("window");

// Local image assets for the two cards
const dogImage = require("../../assets/images/dog main.webp"); // Used for "Lost Pet" card
const catImage = require("../../assets/images/cat main.jpeg"); // Used for "Found Pet" card

export default function HomeScreen() {
  const router = useRouter(); // Initialize router for screen navigation

  return (
    // for ensures content doesn't overlap with device notch or bottom bar
    <SafeAreaView style={styles.safeArea}>

      {/* header with back button and create post button */}
      <View style={styles.header}>

        {/* Back Button to navigates to previous screen */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Ionicons name="chevron-back" size={24} color="#0f3a3a" />
        </Pressable>

        {/* Add Button to navigate to create lost or found post screen */}
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


      {/*Displays the main headline and a short tagline.*/}

      <View style={styles.heroSection}>

        {/* Main title — "Reuniting" is highlighted in orange */}
        <Text style={styles.heroTitle}>
          {" Reuniting pets with\ntheir families."}
        </Text>

        {/* Subtitle tagline beneath the title */}
        <Text style={styles.heroSubtitle}>
          We're here to help you every step of the way.
        </Text>

      </View>

      {/* Two cards for lost and found pets*/}
      <View style={styles.cardsContainer}>

        {/* Lost pet */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed, // Slight scale-down on press
          ]}
          onPress={() => router.push("/lostAndFound/lostAnimalListView")}

        >
          {/* Image area with gradient and text overlay */}
          <View style={styles.imageContainer}>
            <Image source={dogImage} style={styles.cardImage} />

            {/* Dark gradient fades from transparent to dark
                so the white overlay text stays readable */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.62)"]}
              style={styles.gradient}
            />

            {/* Text overlay sitting on top of the gradient */}

            <View style={styles.cardOverlay}>

              {/* Small pill-shaped badge */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Urgent help needed</Text>
              </View>
              <Text style={styles.cardTitle}>I Lost a Pet</Text>
            </View>
          </View>

          {/* For description text below the image */}
          <View style={styles.cardBody}>
            <Text style={styles.cardDescription}>
              Create a missing pet alert for the community.
            </Text>
          </View>
        </Pressable>

        {/* Found Pet */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            pressed && styles.cardPressed,
          ]}
          onPress={() => router.push("/lostAndFound/foundAnimalListView")}
        >
          {/* Image area with gradient and text overlay */}
          <View style={styles.imageContainer}>
            <Image source={catImage} style={styles.cardImage} />

            {/* Same gradient treatment as the Lost Pet card */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.62)"]}
              style={styles.gradient}
            />

            {/* Text overlay with badge and card title */}
            <View style={styles.cardOverlay}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Compassionate care</Text>
              </View>
              <Text style={styles.cardTitle}>I Found a Pet</Text>
            </View>
          </View>

          {/* found card description */}
          <View style={styles.cardBody}>
            <Text style={styles.cardDescription}>
              Report a found animal and help it get home.
            </Text>

          </View>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}


// Defined outside StyleSheet for reuse and easy adjustment
const CARD_IMAGE_HEIGHT = 160; // Height of the image section in each card
const CARD_RADIUS = 28;        // Rounded corner radius applied to cards

// STYLES
const styles = StyleSheet.create({

  // Root container — fills the full screen with a near-white background
  safeArea: {
    flex: 1,
    backgroundColor: "#fdfdfd",
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: "row",           // Lay out children horizontally
    alignItems: "center",
    justifyContent: "space-between", // Push back button left, add button right
    paddingHorizontal: 16,
    paddingTop: 20
    ,
    paddingBottom: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 50,               // Circular tap target
  },
  backButtonPressed: {
    backgroundColor: "#f0f0f0",     // Light grey feedback on press
  },

  // ── Hero Section ────────────────────────────────────────
  heroSection: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 32,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#994700",        // Deep teal
    textAlign: "center",
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 12,
  },

  heroSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
    lineHeight: 24,
    maxWidth: 240,     // Limits subtitle line width for readability
  },

  // ── Cards Container ─────────────────────────────────────
  cardsContainer: {
    flex: 1,                        // Takes remaining vertical space
    paddingHorizontal: 20,
    gap: 20,                        // Space between the two cards
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: CARD_RADIUS,
    overflow: "hidden",             // Clips image and gradient to rounded corners
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,                   // Android shadow equivalent
    flex: 1,                        // Each card fills equal vertical space
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],   // Subtle shrink effect on press
    shadowOpacity: 0.18,
    elevation: 6,
  },

  // ── Card Image Area ──────────────────────────────────────
  imageContainer: {
    height: CARD_IMAGE_HEIGHT,
    width: "100%",
    position: "relative",           // Allows absolute positioning of children
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",            // Fills the container without distortion
  },
  gradient: {
    position: "absolute",           // Sits directly on top of the image
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,                    // Only covers the bottom of the image
  },
  cardOverlay: {
    position: "absolute",           // Floats over both the image and gradient
    bottom: 16,
    left: 16,
    right: 16,
  },

  // ── Badge ────────────────────────────────────────────────
  badge: {
    alignSelf: "flex-start",        // Shrinks to fit its text content
    backgroundColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(255,255,255,0.32)",
    borderWidth: 1,
    borderRadius: 50,               // Pill shape
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

  // ── Card Body (below image) ──────────────────────────────
  cardBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#ffffff",
    flexDirection: "row",           // Description text side by side
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardDescription: {
    color: "rgba(15,58,58,0.75)",   // Translucent teal
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },


});
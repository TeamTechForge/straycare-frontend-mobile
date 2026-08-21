import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BackButton from "../../components/BackButton";

const BRAND_COLOR = "#F5A623";

/**
 * AboutScreen
 * Displays information about the StrayCare application and its mission.
 */
export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>About StrayCare</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="paw" size={40} color="#fff" />
          </View>
          <Text style={styles.appName}>StrayCare</Text>
          <Text style={styles.appTagline}>Community Rescue Network</Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.descriptionText}>
            StrayCare is a community-driven street animal rescue and care platform designed to connect people who find animals in need with rescuers, volunteers, NGOs, shelters, and veterinarians.
          </Text>

          <Text style={styles.descriptionText}>
            Our mission is to make stray animal reporting, rescue coordination, adoption support, and donation transparency easier through one organized digital platform.
          </Text>

          <Text style={styles.descriptionText}>
            With StrayCare, users can report injured or abandoned animals, view rescue updates, communicate with rescuers, support adoption efforts, and stay informed through notifications. Verified rescuers, NGOs, shelters, and veterinarians can manage rescue-related activities and provide timely care.
          </Text>

          <Text style={styles.descriptionText}>
            StrayCare aims to reduce rescue delays, improve coordination, and create a kinder, safer community for street animals.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2026 StrayCare Rescue Foundation</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    paddingTop: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND_COLOR,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#222",
    marginTop: 14,
  },
  appTagline: {
    fontSize: 12,
    color: BRAND_COLOR,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 4,
  },
  contentSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 24,
    color: "#444",
    marginBottom: 16,
    textAlign: "justify",
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  versionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },
  copyrightText: {
    fontSize: 11,
    color: "#999",
    marginTop: 6,
  },
});

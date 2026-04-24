import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import PrimaryButton from "../../components/PrimaryButton";

const BRAND_COLOR = "#F5A623";

export default function VerificationPendingScreen() {
  const router = useRouter();

  const handleReturnHome = () => {
    // TODO: later connect real navigation logic
    // For now, send user to home or landing page
    router.replace("/home");
  };

  const handleContactSupport = () => {
    // TODO: later connect support chat / email / help center
    console.log("Contact support pressed");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Status</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Illustration Area */}
      <View style={styles.illustrationWrapper}>
        <View style={styles.largeCircle}>
          <View style={styles.docCard}>
            <Ionicons name="document-text-outline" size={52} color="#E8D8B8" />
          </View>

          <View style={styles.searchBadge}>
            <Ionicons name="search-outline" size={20} color="#fff" />
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>We're Checking the{"\n"}Details</Text>

      {/* Description */}
      <Text style={styles.description}>
        Your account is under review by StrayCare admins. We take this step to
        ensure the safety of our community and the animals. You will be notified
        via email once verification is complete.
      </Text>

      {/* Time Note */}
      <View style={styles.noteBox}>
        <Ionicons name="information-circle-outline" size={14} color={BRAND_COLOR} />
        <Text style={styles.noteText}>This usually takes 24-48 hours.</Text>
      </View>

      {/* Action Button */}
      <View style={styles.buttonWrapper}>
        <PrimaryButton title="Return to Home" onPress={handleReturnHome} />
      </View>

      {/* Support */}
      <TouchableOpacity style={styles.supportRow} onPress={handleContactSupport}>
        <Ionicons name="headset-outline" size={14} color="#666" />
        <Text style={styles.supportText}>Contact Support</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  headerSpacer: {
    width: 22,
  },
  illustrationWrapper: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 28,
  },
  largeCircle: {
    width: 195,
    height: 195,
    borderRadius: 97.5,
    backgroundColor: "#FCF6EA",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  docCard: {
    width: 94,
    height: 110,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchBadge: {
    position: "absolute",
    bottom: 36,
    right: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#1D1D1D",
    lineHeight: 30,
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
    color: "#666",
    marginHorizontal: 8,
  },
  noteBox: {
    marginTop: 18,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF6E7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  noteText: {
    color: BRAND_COLOR,
    fontSize: 13,
    fontWeight: "500",
  },
  buttonWrapper: {
    marginTop: 34,
  },
  supportRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  supportText: {
    fontSize: 13,
    color: "#666",
  },
});
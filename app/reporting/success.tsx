import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function Success() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const caseId = params.caseId || "Unknown";

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* SUCCESS ICON */}
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
        </View>

        {/* TITLE */}
        <Text style={styles.header}>Report Submitted!</Text>

        {/* MESSAGE */}
        <Text style={styles.subtext}>
          Thank you for helping keep stray animals safe.  
          Rescuers will now review your report.
        </Text>

        {/* CASE ID */}
        <View style={styles.caseCard}>
          <Text style={styles.caseLabel}>CASE ID</Text>
          <Text style={styles.caseValue}>{caseId}</Text>
        </View>

      </ScrollView>

      {/* BUTTON */}
      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton
          title="Back to Map"
          onPress={() => router.push("/reporting")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },

  scrollContent: {
    padding: 20,
    paddingBottom: 160,
    alignItems: "center",
  },

  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },

  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },

  subtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },

  caseCard: {
    backgroundColor: "#FFF4D1",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },

  caseLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },

  caseValue: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },

  bottomButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
});

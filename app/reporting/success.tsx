import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function Success() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const caseId =
    params.caseId ||
    "STRAY-" + Math.floor(10000 + Math.random() * 90000);

  return (
    <View style={styles.container}>
      {/* check image icon for successfull submission */}
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name="check"
          size={60}
          color="white"
        />
      </View>

      <Text style={styles.title}>Report Submitted</Text>
      <Text style={styles.subtitle}>
        Thank you for helping us take action.
      </Text>

      {/* case id */}
      <View style={styles.caseCard}>
        <Text style={styles.caseLabel}>CASE ID</Text>
        <Text style={styles.caseValue}>{caseId}</Text>
      </View>

      <PrimaryButton
        title="Back to Home"
        onPress={() => router.push("/")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },

  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2ECC71",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
  },

  caseCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    marginBottom: 40,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
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
});

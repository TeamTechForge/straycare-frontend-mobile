import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DonationSuccess() {
  const router = useRouter();
  const { transactionId, amount, organization } = useLocalSearchParams();

  const displayTransactionId = transactionId
    ? String(transactionId)
    : "Pending (will be updated from server)";

  const displayAmount = amount ? `Rs. ${parseFloat(amount as string).toFixed(2)}` : "";
  const displayOrganization = organization ? String(organization) : "";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Donate & Support♡</Text>

      <View style={styles.middle}>
        <View style={styles.box}>
          <Ionicons
            name="checkmark-circle"
            size={90}
            color="#F5A623"
            style={styles.icon}
          />

          <Text style={styles.message}>Thank You!</Text>

          <Text style={styles.subMessage}>
            Donation Completed Successfully
          </Text>

          {displayOrganization ? (
            <Text style={styles.detail}>Organization: {displayOrganization}</Text>
          ) : null}

          {displayAmount ? (
            <Text style={styles.detail}>Amount: {displayAmount}</Text>
          ) : null}

          <Text style={styles.transaction}>
            Transaction ID: {displayTransactionId}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/donate")}
          >
            <Text style={styles.buttonText}>Back to Donate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/donate/History")}
          >
            <Text style={styles.buttonText}>View Donation History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomNav}>
        <Ionicons name="home-outline" size={24} />
        <Ionicons name="people-outline" size={24} />
        <Ionicons name="location-outline" size={24} />
        <Ionicons name="chatbubble-outline" size={24} />
        <Ionicons name="person-outline" size={24} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  middle: { flex: 1, justifyContent: "center", alignItems: "center" },
  box: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
  },
  icon: { marginBottom: 15 },
  message: { fontSize: 24, fontWeight: "bold", marginBottom: 5, color: "#222" },
  subMessage: { fontSize: 16, marginBottom: 10, color: "#555", textAlign: "center" },
  detail: { fontSize: 14, marginBottom: 5, color: "#444", textAlign: "center" },
  transaction: { fontSize: 13, marginBottom: 25, color: "#777", textAlign: "center" },
  button: {
    backgroundColor: "#F5A623",
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    width: 220,
  },
  buttonText: { textAlign: "center", fontSize: 16, fontWeight: "bold", color: "#000" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
});
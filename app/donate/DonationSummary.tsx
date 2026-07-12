import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DonationSummary() {
  const { category, organization, organizationName, frequency, plan, amount, paymentMethod, paymentFailed } =
    useLocalSearchParams();

  const router = useRouter();
  const formattedAmount = parseFloat(amount as string).toFixed(2);

  useEffect(() => {
    if (paymentFailed === "true") {
      Alert.alert("Payment Failed", "Your payment was not successful. Please try again.");
    }
  }, [paymentFailed]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Donate & Support♡</Text>
      <Text style={styles.subtitle}>Help Provide Care for Stray Animals</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.label}>Donation Type: {category}</Text>
        {/* Show display name to user, not the _id */}
        <Text style={styles.label}>Organization: {organizationName}</Text>
        <Text style={styles.label}>Frequency: {frequency}</Text>
        {frequency === "Recurring" && plan ? (
          <Text style={styles.label}>Donation Plan: {plan}</Text>
        ) : null}
        <Text style={styles.label}>Amount: Rs. {formattedAmount}</Text>
        <Text style={styles.label}>Payment Method: {paymentMethod}</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/donate/PayhereCheckout",
              params: {
                amount: formattedAmount,
                category,
                organization,         // _id for merchant ID lookup
                organizationName,     // display name for saving in donation record
                frequency,
                plan,
              },
            })
          }
        >
          <Text style={styles.buttonText}>Pay with PayHere</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomBar}>
        <Ionicons name="home" size={24} color="#000" />
        <Ionicons name="people-outline" size={24} color="#000" />
        <Ionicons name="add-circle-outline" size={24} color="#000" />
        <Ionicons name="chatbubble-outline" size={24} color="#000" />
        <Ionicons name="person-outline" size={24} color="#000" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  subtitle: { fontSize: 16, marginBottom: 20, color: "#555" },
  summaryBox: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  label: { fontSize: 16, marginVertical: 5 },
  button: {
    backgroundColor: "#F5A623",
    padding: 15,
    marginTop: 20,
    borderRadius: 8,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    borderTopWidth: 1,
    borderColor: "#ddd",
    marginTop: "auto",
    backgroundColor: "#FFF9E6",
  },
});







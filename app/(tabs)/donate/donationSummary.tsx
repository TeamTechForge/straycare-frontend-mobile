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
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.title}>Donation Summary</Text>
        <Text style={styles.subtitle}>Please review your donation details</Text>

        <View style={styles.summaryBox}>
          <Text style={styles.label}>Donation Type: {category}</Text>
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
                pathname: "/donate/payhereCheckout",
                params: {
                  amount: formattedAmount,
                  category,
                  organization,
                  organizationName,
                  frequency,
                  plan,
                },
              })
            }
          >
            <Text style={styles.buttonText}>Pay with PayHere</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20, 
    backgroundColor: "#fff" 
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  subtitle: { fontSize: 16, marginBottom: 20, color: "#555" },
  summaryBox: {
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee", // Matches the clean, modern card style of history cards
    marginTop: 30, 
  },
  label: { fontSize: 16, marginVertical: 5 },
  button: {
    backgroundColor: "#F5A623",
    padding: 15,
    marginTop: 30, 
    borderRadius: 8,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});







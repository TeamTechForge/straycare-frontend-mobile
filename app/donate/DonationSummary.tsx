import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import BackButton from "../../components/BackButton";

export default function DonationSummary() {
  const { category, organization, organizationName, frequency, plan, amount, paymentMethod, paymentFailed } =
    useLocalSearchParams();

  const router = useRouter();
  const formattedAmount = parseFloat(amount as string).toFixed(2);
  const paymentMethodLabel =
    paymentMethod === "MASTER"
      ? "Mastercard"
      : paymentMethod === "AMEX"
        ? "American Express"
        : "Visa";

  useEffect(() => {
    if (paymentFailed === "true") {
      Alert.alert("Payment Failed", "Your payment was not successful. Please try again.");
    }
  }, [paymentFailed]);

  return (
    <View style={styles.container}>
      <View style={{ marginBottom: 12 }}>
        <BackButton onPress={() => router.back()} />
      </View>
      <Text style={styles.title}>Donation Summary</Text>
      <Text style={styles.subtitle}>Please review your donation details</Text>

      <View style={styles.summaryBox}>
        <Text style={styles.label}>Donation Type: {category}</Text>
        {/* Show display name to user, not the _id */}
        <Text style={styles.label}>Organization: {organizationName}</Text>
        <Text style={styles.label}>Frequency: {frequency}</Text>
        {frequency === "Recurring" && plan ? (
          <Text style={styles.label}>Donation Plan: {plan}</Text>
        ) : null}
        <Text style={styles.label}>Amount: Rs. {formattedAmount}</Text>
        <Text style={styles.label}>Payment Method: {paymentMethodLabel}</Text>
      </View>

      <PrimaryButton
        title="Pay with PayHere"
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
              paymentMethod,
            },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  subtitle: { fontSize: 16, marginBottom: 20, color: "#555" },
  summaryBox: {
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginTop: 30,
    marginBottom: 20,
  },
  label: { fontSize: 16, marginVertical: 5 },
});






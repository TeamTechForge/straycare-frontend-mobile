import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BASE_URL } from "../../constants/config.constants";
import { useAuth } from "../../contexts/AuthContext";

type RecurringStatusResponse = {
  status: "PENDING" | "ACTIVE" | "FAILED" | "CANCELLED" | "COMPLETED";
};

export default function DonationSuccess() {
  const router = useRouter();
  const { user } = useAuth();
  const { transactionId, amount, organization, recurring } = useLocalSearchParams();
  const [recurringStatus, setRecurringStatus] = useState(recurring === "true" ? "PENDING" : "ACTIVE");

  useEffect(() => {
    if (recurring !== "true" || !transactionId) return;
    let cancelled = false;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        const response = await axios.get<RecurringStatusResponse>(
          `${BASE_URL}/api/donations/recurring/${encodeURIComponent(String(transactionId))}/status`,
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );
        if (!cancelled) setRecurringStatus(response.data.status);
        if (response.data.status === "PENDING" && attempts++ < 5 && !cancelled) {
          setTimeout(checkStatus, 2000);
        }
      } catch {
        if (attempts++ < 5 && !cancelled) setTimeout(checkStatus, 2000);
      }
    };

    checkStatus();
    return () => { cancelled = true; };
  }, [recurring, transactionId]);

  const isRecurringPending = recurring === "true" && recurringStatus === "PENDING";
  const recurringFailed = recurring === "true" && ["FAILED", "CANCELLED"].includes(recurringStatus);

  const displayTransactionId = transactionId
    ? String(transactionId)
    : "Pending (will be updated from server)";

  const displayAmount = amount ? `Rs. ${parseFloat(amount as string).toFixed(2)}` : "";
  const displayOrganization = organization ? String(organization) : "";

  const canReceiveDonations = user?.role === "vet" || user?.role === "ngo";

  const handleViewHistory = () => {
    if (canReceiveDonations) {
      router.push("/donate/DonationHub");
    } else {
      router.push("/donate/History");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.middle}>
        <View style={styles.contentContainer}>
          {isRecurringPending ? <ActivityIndicator size="large" color="#F5A623" style={styles.icon} /> : <Ionicons
            name={recurringFailed ? "close-circle" : "checkmark-circle"}
            size={90}
            color={recurringFailed ? "#D64545" : "#F5A623"}
            style={styles.icon}
          />}

          <Text style={styles.message}>
            {isRecurringPending ? "Confirming Payment" : recurringFailed ? "Payment Not Activated" : "Thank You!"}
          </Text>

          <Text style={styles.subMessage}>
            {isRecurringPending
              ? "PayHere is confirming your recurring donation. It will appear in history after confirmation."
              : recurringFailed
                ? "PayHere did not activate this recurring donation."
                : recurring === "true" ? "Recurring Donation Activated" : "Donation Completed Successfully"}
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

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.replace("/Donate")}>
              <Text style={styles.actionButtonText}>Back to Donate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleViewHistory}>
              <Text style={styles.actionButtonText}>
                {canReceiveDonations ? "View Donation Hub" : "View Donation History"}
              </Text>
            </TouchableOpacity>
          </View>
        </View >
      </View >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  middle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  icon: {
    marginBottom: 20,
  },
  message: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#222",
  },
  subMessage: {
    fontSize: 16,
    marginBottom: 30,
    color: "#555",
    textAlign: "center",
  },
  detail: {
    fontSize: 15,
    marginBottom: 8,
    color: "#444",
    textAlign: "center",
  },
  transaction: {
    fontSize: 13,
    marginTop: 15,
    marginBottom: 35,
    color: "#777",
    textAlign: "center",
  },
  actions: {
    width: "78%",
    maxWidth: 340,
    gap: 12,
  },
  actionButton: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#F5A623",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#1F1A17",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});

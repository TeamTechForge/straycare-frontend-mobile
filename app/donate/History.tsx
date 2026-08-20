import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "../../components/BackButton";
import { BASE_URL } from "../../constants/config.constants";

type Donation = {
  _id: string;
  organization: string;
  amount: number;
  timestamp: string;
  status: string;
  category: string;
  orderId: string;
  frequency?: string;
  plan?: string;
};

type RecurringDonation = {
  _id: string;
  orderId: string;
  subscriptionId?: string;
  organization: string;
  amount: number;
  plan: string;
  recurrence: string;
  status: "PENDING" | "ACTIVE" | "FAILED" | "CANCELLED" | "COMPLETED";
  installmentsPaid: number;
  createdAt?: string;
  latestPayment?: Donation | null;
};

type Props = {
  // The donation hub already provides its own page header.
  hideHeader?: boolean;
};

export default function DonationHistory({ hideHeader = false }: Props) {
  const router = useRouter();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [recurringDonations, setRecurringDonations] = useState<RecurringDonation[]>([]);
  const [loading, setLoading] = useState(true);
  // The selected plan is shown in the cancellation confirmation modal.
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringDonation | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationError, setCancellationError] = useState("");

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");

      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Load one-time and recurring records together to reduce waiting time.
      const [historyResult, recurringResult] = await Promise.allSettled([
        axios.get(`${BASE_URL}/api/donations/history`, config),
        axios.get(`${BASE_URL}/api/donations/recurring`, config),
      ]);

      // One failed request should not hide the data returned by the other request.
      if (historyResult.status === "fulfilled") setDonations(historyResult.value.data as Donation[]);
      if (recurringResult.status === "fulfilled") {
        setRecurringDonations(recurringResult.value.data as RecurringDonation[]);
      }
    } catch (err) {
      console.error("Error fetching donations:", err);
    } finally {
      setLoading(false);
    }
  };

  const cancelRecurringDonation = async () => {
    if (!selectedRecurring) return;
    try {
      setCancelling(true);
      setCancellationError("");
      const token = await SecureStore.getItemAsync("authToken");
      await axios.post(
        `${BASE_URL}/api/donations/recurring/${selectedRecurring._id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
      );
      // Update the card immediately after the backend confirms cancellation.
      setRecurringDonations((current) =>
        current.map((item) =>
          item._id === selectedRecurring._id ? { ...item, status: "CANCELLED" } : item
        )
      );
      setSelectedRecurring(null);
    } catch (error: any) {
      setCancellationError(
        error.response?.data?.error || "Unable to cancel this recurring donation. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  };

  // Recurring plans appear before individual one-time payments.
  const recurringHeader = (
    <View>
      {recurringDonations.length > 0 && (
        <View style={styles.recurringSection}>
          <Text style={styles.sectionTitle}>Recurring Donations</Text>
          {recurringDonations.map((item) => (
            <View key={item._id} style={styles.card}>
              <Text style={styles.org}>{item.organization || "StrayCare"}</Text>
              <Text style={styles.category}>{item.plan} recurring donation</Text>
              <Text style={styles.amount}>Rs. {item.amount.toFixed(2)}</Text>
              {item.createdAt ? (
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              ) : null}
              <Text style={styles.orderId}>Order: {item.orderId}</Text>
              <Text style={styles.recurringMeta}>{item.installmentsPaid || 0} payment(s) completed</Text>

              <View style={styles.row}>
                <View style={[styles.statusPill, styles[`recurring${item.status}`]]}>
                  <Text style={styles.recurringStatusText}>{item.status}</Text>
                </View>
                <View style={styles.recurringActions}>
                  {/* A receipt is available only after at least one completed charge. */}
                  {(item.installmentsPaid || 0) > 0 && (
                    <TouchableOpacity
                      style={styles.receiptBtn}
                      onPress={() => router.push({
                        pathname: "/donate/Receipt",
                        params: {
                          // Use the latest payment record when it is available.
                          donation: JSON.stringify(item.latestPayment || {
                            _id: item._id,
                            orderId: item.orderId,
                            organization: item.organization || "StrayCare",
                            amount: item.amount,
                            timestamp: item.createdAt || new Date().toISOString(),
                            status: "SUCCESS",
                            category: `${item.plan} recurring donation`,
                            frequency: "Recurring",
                            plan: item.plan,
                          }),
                        },
                      })}
                    >
                      <Text style={styles.receiptText}>Receipt</Text>
                    </TouchableOpacity>
                  )}
                  {/* Only active plans can be cancelled. */}
                  {item.status === "ACTIVE" && (
                    <TouchableOpacity
                      style={styles.cancelSubscriptionButton}
                      onPress={() => {
                        setCancellationError("");
                        setSelectedRecurring(item);
                      }}
                    >
                      <Text style={styles.cancelSubscriptionText}>Cancel Plan</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
      {donations.some((item) => item.frequency !== "Recurring") && (
        <Text style={styles.sectionTitle}>One-time Donations</Text>
      )}
    </View>
  );

  // Render a single completed or failed one-time donation.
  const renderItem = ({ item }: { item: Donation }) => (
    <View style={styles.card}>
      <Text style={styles.org}>{item.organization || "StrayCare"}</Text>
      <Text style={styles.category}>{item.category || "General"}</Text>
      <Text style={styles.amount}>Rs. {item.amount.toFixed(2)}</Text>
      <Text style={styles.date}>{new Date(item.timestamp).toLocaleDateString()}</Text>
      <Text style={styles.orderId}>Order: {item.orderId}</Text>

      <View style={styles.row}>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: item.status === "SUCCESS" ? "#d4edda" : "#f8d7da" },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: item.status === "SUCCESS" ? "#155724" : "#721c24" },
            ]}
          >
            {item.status}
          </Text>
        </View>

        {item.status === "SUCCESS" && (
          <TouchableOpacity
            style={styles.receiptBtn}
            onPress={() => router.push({ pathname: "/donate/Receipt", params: { donation: JSON.stringify(item) } })}
          >
            <Text style={styles.receiptText}>Receipt</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={hideHeader ? [] : ["top"]}>
      {!hideHeader && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <BackButton onPress={() => router.back()} />
          <Text style={[styles.title, { marginBottom: 0, marginLeft: 12 }]}>Donation History</Text>
        </View>
      )}
      {donations.length === 0 && recurringDonations.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#999", marginTop: 40 }}>No donations yet</Text>
      ) : (
        <FlatList
          // Recurring plans are displayed separately above this list.
          data={donations.filter((item) => item.frequency !== "Recurring")}
          keyExtractor={(donation) => donation._id}
          renderItem={renderItem}
          ListHeaderComponent={recurringHeader}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <Modal
        visible={selectedRecurring !== null}
        transparent
        animationType="fade"
        onRequestClose={() => !cancelling && setSelectedRecurring(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => !cancelling && setSelectedRecurring(null)}
        >
          <Pressable style={styles.cancelModal} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.cancelModalTitle}>Cancel recurring donation?</Text>
            <Text style={styles.cancelModalMessage}>
              Future {selectedRecurring?.plan.toLowerCase()} payments to {selectedRecurring?.organization} will stop. Previous donations will remain in your history.
            </Text>
            {cancellationError ? <Text style={styles.cancelError}>{cancellationError}</Text> : null}
            <View style={styles.cancelModalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.keepButton]}
                onPress={() => setSelectedRecurring(null)}
                disabled={cancelling}
              >
                <Text style={styles.keepButtonText}>Keep Donation</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmCancelButton]}
                onPress={cancelRecurringDonation}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmCancelText}>Cancel Plan</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  card: { backgroundColor: "#f9f9f9", padding: 15, borderRadius: 10, marginBottom: 15 },
  org: { fontSize: 16, fontWeight: "bold" },
  category: { fontSize: 13, color: "#666", marginTop: 2 },
  amount: { fontSize: 14, marginTop: 5, fontWeight: "600" },
  date: { fontSize: 12, color: "#555", marginTop: 5 },
  orderId: { fontSize: 11, color: "#999", marginTop: 3 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  statusPill: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 20 },
  statusText: { fontWeight: "bold", fontSize: 12 },
  receiptBtn: { marginLeft: 10, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: "#FFB700", borderRadius: 6 },
  receiptText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#2D211C", marginBottom: 10 },
  recurringSection: { marginBottom: 18 },
  recurringMeta: { fontSize: 11, color: "#7C6F64", marginTop: 5 },
  recurringACTIVE: { backgroundColor: "#DCFCE7" },
  recurringPENDING: { backgroundColor: "#FEF3C7" },
  recurringFAILED: { backgroundColor: "#FEE2E2" },
  recurringCANCELLED: { backgroundColor: "#E5E7EB" },
  recurringCOMPLETED: { backgroundColor: "#DBEAFE" },
  recurringStatusText: { color: "#374151", fontSize: 10, fontWeight: "700" },
  recurringActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  cancelSubscriptionButton: { paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: "#DC2626", borderRadius: 6 },
  cancelSubscriptionText: { color: "#B91C1C", fontSize: 12, fontWeight: "600" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.48)", alignItems: "center", justifyContent: "center", padding: 24 },
  cancelModal: { width: "100%", maxWidth: 390, backgroundColor: "#fff", borderRadius: 18, padding: 22 },
  cancelModalTitle: { fontSize: 20, fontWeight: "700", color: "#2D211C", textAlign: "center" },
  cancelModalMessage: { fontSize: 14, lineHeight: 21, color: "#5B6472", textAlign: "center", marginTop: 12 },
  cancelError: { color: "#B91C1C", backgroundColor: "#FEF2F2", fontSize: 12, textAlign: "center", padding: 9, borderRadius: 8, marginTop: 12 },
  cancelModalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalButton: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 10, paddingHorizontal: 8 },
  keepButton: { borderWidth: 1, borderColor: "#D1D5DB", backgroundColor: "#fff" },
  keepButtonText: { color: "#4B5563", fontSize: 13, fontWeight: "600", textAlign: "center" },
  confirmCancelButton: { backgroundColor: "#DC2626" },
  confirmCancelText: { color: "#fff", fontSize: 13, fontWeight: "700", textAlign: "center" },
});

import { Feather } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useChatApi } from "../../hooks/useChatApi";
import { BASE_URL } from "../../constants/config.constants";

type Donation = {
  id: string;
  donorId: string;
  donor: string;
  amount: string;
  date: string;
  frequency: "Recurring" | "One-time";
  plan?: string;
};

export default function ReceivedDonations() {
  const router = useRouter();
  const { user } = useAuth();
  const { createConversation } = useChatApi();

  const [donations, setDonations] = useState<Donation[]>([]);
  // Total contains the sum of all successful donations received.
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [messagingId, setMessagingId] = useState<string | null>(null);
  const [recurringEnabled, setRecurringEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetchReceivedDonations();
  }, []);

  const fetchReceivedDonations = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) return;

      const donRes: any = await axios.get(`${BASE_URL}/api/donations/received`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Check whether this organization can receive recurring donations.
      try {
        const profileRes: any = await axios.get(`${BASE_URL}/api/profiles/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecurringEnabled(profileRes.data.recurringPaymentsEnabled === true);
      } catch (profileError) {
        console.error("Error checking recurring donation setup:", profileError);
      }

      // Prepare API records for display in the donation cards.
      const fetchedDonations = donRes.data.map((d: any) => ({
        id: d._id,
        donorId: d.donorId,
        donor: d.donorName || "Anonymous",
        amount: `Rs. ${parseFloat(d.amount).toFixed(2)}`,
        date: new Date(d.timestamp).toLocaleDateString(),
        frequency: d.frequency === "Recurring" ? "Recurring" : "One-time",
        plan: d.plan,
      }));

      // Calculate the amount shown at the top of the page.
      const calculatedTotal = donRes.data.reduce((sum: number, d: any) => sum + parseFloat(d.amount), 0);

      setDonations(fetchedDonations);
      setTotal(calculatedTotal);
    } catch (error) {
      console.error("Error fetching received donations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageDonor = async (item: Donation) => {
    if (!item.donorId || messagingId) return;

    setMessagingId(item.id);

    try {
      // Reuse an existing direct conversation or create a new one.
      const conversation = (await createConversation(item.donorId, "direct")) as any;

      const otherParticipant = conversation.participants?.find(
        (p: any) => p._id !== user?._id
      );

      router.push({
        pathname: "/chat/[conversationId]",
        params: {
          conversationId: conversation._id,
          recipientName: otherParticipant?.name || item.donor,
          recipientId: item.donorId,
          recipientImage: otherParticipant?.profileImage || "",
        },
      });
    } catch (error: any) {
      console.error("Failed to start conversation:", error);
      Alert.alert("Could Not Start Chat", error.message || "Something went wrong.");
    } finally {
      setMessagingId(null);
    }
  };

  const renderItem = ({ item }: { item: Donation }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.donor}>Donor: {item.donor}</Text>
        <View style={[
          styles.frequencyBadge,
          item.frequency === "Recurring" ? styles.recurringBadge : styles.oneTimeBadge,
        ]}>
          <Text style={[
            styles.frequencyText,
            item.frequency === "Recurring" ? styles.recurringText : styles.oneTimeText,
          ]}>
            {item.frequency === "Recurring"
              ? `${item.plan || "Recurring"}${item.plan ? " Recurring" : ""}`
              : "One-time"}
          </Text>
        </View>
      </View>
      <Text style={styles.amount}>Amount: {item.amount}</Text>
      <Text style={styles.date}>Date: {item.date}</Text>

      {item.donorId && (
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={() => handleMessageDonor(item)}
          disabled={messagingId === item.id}
        >
          {messagingId === item.id ? (
            <ActivityIndicator size="small" color="#F5A623" />
          ) : (
            <>
              <Feather name="message-circle" size={14} color="#F5A623" />
              <Text style={styles.messageBtnText}>Message</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Donations received</Text>
        <Text style={styles.totalAmount}>Rs. {total.toFixed(2)}</Text>
      </View>

      {/* Show setup guidance only when recurring credentials are missing. */}
      {recurringEnabled === false && (
        <TouchableOpacity
          style={styles.recurringNotice}
          onPress={() => router.push("/profile/EditProfile")}
          activeOpacity={0.8}
        >
          <Feather name="repeat" size={20} color="#B45309" />
          <View style={styles.recurringNoticeContent}>
            <Text style={styles.recurringNoticeTitle}>Enable recurring donations</Text>
            <Text style={styles.recurringNoticeText}>
              To receive cancellable recurring donations, open Edit Profile and add your PayHere API App ID and App Secret.
            </Text>
            <Text style={styles.recurringNoticeLink}>Go to Edit Profile →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Keep an empty-state message when the organization has no donations. */}
      {donations.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#999", marginTop: 40 }}>No donations received yet</Text>
      ) : (
        <FlatList
          data={donations}
          keyExtractor={(donation) => donation.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 10 },
  totalBox: {
    backgroundColor: "#FFF7E6",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  totalLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
  totalAmount: { fontSize: 20, fontWeight: "bold", color: "#222", marginTop: 5 },
  recurringNotice: { flexDirection: "row", gap: 10, backgroundColor: "#FFF7E6", borderWidth: 1, borderColor: "#F6DFC0", borderRadius: 12, padding: 13, marginBottom: 18 },
  recurringNoticeContent: { flex: 1 },
  recurringNoticeTitle: { color: "#7A4A08", fontSize: 14, fontWeight: "700" },
  recurringNoticeText: { color: "#705B3E", fontSize: 12, lineHeight: 18, marginTop: 4 },
  recurringNoticeLink: { color: "#B45309", fontSize: 12, fontWeight: "700", marginTop: 7 },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  donor: { fontSize: 16, fontWeight: "bold" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  frequencyBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 20 },
  recurringBadge: { backgroundColor: "#DCFCE7" },
  oneTimeBadge: { backgroundColor: "#FEF3C7" },
  frequencyText: { fontSize: 10, fontWeight: "700" },
  recurringText: { color: "#166534" },
  oneTimeText: { color: "#92400E" },
  amount: { fontSize: 14, marginTop: 5, fontWeight: "600" },
  date: { fontSize: 12, color: "#555", marginTop: 5 },
  messageBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F5A623",
  },
  messageBtnText: {
    color: "#F5A623",
    fontWeight: "600",
    fontSize: 12,
  },
});

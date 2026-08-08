import { Feather } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useChatApi } from "../../hooks/useChatApi";

type Donation = {
  id: string;
  donorId: string;
  donor: string;
  amount: string;
  date: string;
};

export default function ReceivedDonations() {
  const router = useRouter();
  const { user } = useAuth();
  const { createConversation } = useChatApi();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const BACKEND_URL = "http://192.168.8.160:5000";

  useEffect(() => {
    fetchReceivedDonations();
  }, []);

  const fetchReceivedDonations = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) return;

      const donRes: any = await axios.get(`${BACKEND_URL}/api/donations/received`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const fetchedDonations = donRes.data.map((d: any) => ({
        id: d._id,
        donorId: d.donorId,
        donor: d.donorName || "Anonymous",
        amount: `Rs. ${parseFloat(d.amount).toFixed(2)}`,
        date: new Date(d.timestamp).toLocaleDateString(),
      }));

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
      <Text style={styles.donor}>Donor: {item.donor}</Text>
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
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  donor: { fontSize: 16, fontWeight: "bold" },
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

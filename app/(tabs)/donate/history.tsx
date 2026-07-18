
import axios from "axios";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Donation = {
  _id: string;
  organization: string;
  amount: number;
  timestamp: string;
  status: string;
  category: string;
  orderId: string;
};

export default function DonationHistory() {
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = "http://192.168.8.100:5000";

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");

      const res = await axios.get(`${BACKEND_URL}/api/donations/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDonations(res.data);
    } catch (err) {
      console.error("Error fetching donations:", err);
    } finally {
      setLoading(false); 
    }
  };

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
            onPress={() => router.push({ pathname: "/donate/receipt", params: { donation: JSON.stringify(item) } })}
          >
            <Text style={styles.receiptText}>Receipt</Text>
          </TouchableOpacity>
        )}
      </View>
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
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.heading}>Donation History</Text>

        {donations.length === 0 ? (
          <Text style={{ textAlign: "center", color: "#999", marginTop: 40 }}>No donations yet</Text>
        ) : (
          <FlatList
            data={donations}
            keyExtractor={(donation) => donation._id}     
            renderItem={renderItem}                       
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    paddingHorizontal: 20, 
    paddingTop: 60
  },
  heading: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginBottom: 20, 
    color: "#000"
  },
  card: { 
    backgroundColor: "#f9f9f9", 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee"
  },
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
});
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

type Donation = {
    id: string;
    donor: string;
    amount: string;
    date: string;
};

export default function ReceivedDonations() {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const BACKEND_URL = "http://192.168.8.160:5000";

    useEffect(() => {
        fetchReceivedDonations();
    }, []);

    const fetchReceivedDonations = async () => {
        try {
            const token = await SecureStore.getItemAsync("authToken");
            if (!token) return;

            const userRes: any = await axios.get(`${BACKEND_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const orgId = userRes.data.user.id;

            const donRes: any = await axios.get(`${BACKEND_URL}/api/donations/received/${orgId}`);

            const fetchedDonations = donRes.data.map((d: any) => ({
                id: d._id,
                donor: "Anonymous Donor",
                amount: `Rs. ${parseFloat(d.amount).toFixed(2)}`,
                date: new Date(d.timestamp).toLocaleDateString()
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

    const renderItem = ({ item }: { item: Donation }) => (
        <View style={styles.card}>
            <Text style={styles.donor}>Donor: {item.donor}</Text>
            <Text style={styles.amount}>Amount: {item.amount}</Text>
            <Text style={styles.date}>Date: {item.date}</Text>
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
            {/* Total Donations */}
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
        backgroundColor: "#F5A623",
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        alignItems: "center",
    },
    totalLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
    totalAmount: { fontSize: 20, fontWeight: "bold", marginTop: 5 },
    card: {
        backgroundColor: "#f9f9f9",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    donor: { fontSize: 16, fontWeight: "bold" },
    amount: { fontSize: 14, marginTop: 5 },
    date: { fontSize: 12, color: "#555", marginTop: 5 },
});

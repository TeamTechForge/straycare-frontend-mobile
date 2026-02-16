import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

type Donation = {
    id: string;
    donor: string;
    amount: string;
    date: string;
};

export default function ReceivedDonations() {
    const donations: Donation[] = [
        { id: "1", donor: "Nayani Gunasena", amount: "LKR 3000", date: "12 Feb 2026" },
        { id: "2", donor: "Anula Hewage", amount: "LKR 5000", date: "4 Feb 2026" },
        { id: "3", donor: "Saman De Silva", amount: "LKR 7000", date: "10 Jan 2026" },
    ];

    const renderItem = ({ item }: { item: Donation }) => (
        <View style={styles.card}>
            <Text style={styles.donor}>Donor: {item.donor}</Text>
            <Text style={styles.amount}>Amount: {item.amount}</Text>
            <Text style={styles.date}>Date: {item.date}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Received Donations</Text>

            {/* Total Donations */}
            <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Total Donations received</Text>
                <Text style={styles.totalAmount}>Rs. 15,000</Text>
            </View>

            {/* Donation List */}
            <FlatList
                data={donations}
                keyExtractor={(donation) => donation.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 80 }}
            />

            {/* Bottom Navigation */}
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
    title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
    totalBox: {
        backgroundColor: "#FFD700",
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
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        padding: 15,
        borderTopWidth: 1,
        borderColor: "#ddd",
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: "#fff",
    },
});

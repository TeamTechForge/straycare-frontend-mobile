import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Donation = {
    id: string;
    organization: string;
    amount: string;
    date: string;
    status: string;
};

export default function DonationHistory() {
    const router = useRouter();

    const donations: Donation[] = [
        {
            id: "1",
            organization: "Hope Animal Shelter – Kandy",
            amount: "Rs.1000.00",
            date: "05/05/2026",
            status: "SUCCESS",
        },
        {
            id: "2",
            organization: "Case 005 (Puppy Rescue)",
            amount: "Rs.2000.00",
            date: "05/03/2026",
            status: "SUCCESS",
        },
    ];

    const renderItem = ({ item }: { item: Donation }) => (
        <View style={styles.card}>
            <Text style={styles.org}>{item.organization}</Text>
            <Text style={styles.amount}>{item.amount}</Text>
            <Text style={styles.date}>{item.date}</Text>

            {/* Status + Receipt row */}
            <View style={styles.row}>
                <View style={styles.statusPill}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
                <TouchableOpacity style={styles.receiptButton}>
                    <Text style={styles.receiptText}>Receipt</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Donate & Support♡</Text>
            <Text style={styles.heading}>Donation History</Text>

            <FlatList
                data={donations}
                keyExtractor={(donation) => donation.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 80 }}
            />

            {/* Bottom Navigation */}
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
    container: { flex: 1, backgroundColor: "#fff", padding: 20 },
    title: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
    heading: {
        fontSize: 18,
        fontWeight: "600",
        marginVertical: 15,
        textAlign: "center",
        color: "#333",
    },
    card: {
        backgroundColor: "#f9f9f9",
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
    },
    org: { fontSize: 16, fontWeight: "bold" },
    amount: { fontSize: 14, marginTop: 5 },
    date: { fontSize: 12, color: "#555", marginTop: 5 },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
    },
    statusPill: {
        backgroundColor: "#d4edda",
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    statusText: {
        color: "#155724",
        fontWeight: "bold",
        fontSize: 12,
    },
    receiptButton: {
        backgroundColor: "#F5A623",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    receiptText: { fontSize: 14, fontWeight: "bold", color: "#000" },
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



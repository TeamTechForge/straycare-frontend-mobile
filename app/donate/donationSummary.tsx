import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DonationSummary() {
    const { category, organization, frequency, plan, amount, paymentMethod } = useLocalSearchParams();
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* Headings outside the box */}
            <Text style={styles.title}>Donate & Support♡</Text>
            <Text style={styles.subtitle}>Help Provide Care for Stray Animals</Text>

            {/* Content inside off-white box */}
            <View style={styles.summaryBox}>
                <Text style={styles.label}>Donation Type: {category}</Text>
                <Text style={styles.label}>Organization: {organization}</Text>
                <Text style={styles.label}>Frequency: {frequency}</Text>

                {frequency === "Recurring" && plan ? (
                    <Text style={styles.label}>Donation Plan: {plan}</Text>
                ) : null}

                <Text style={styles.label}>Amount: Rs. {amount}</Text>
                <Text style={styles.label}>Payment Method: {paymentMethod}</Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                        router.push({
                            pathname: "/donate/payhereCheckout",
                            params: {
                                amount: amount ? amount : "100.00" // always a valid numeric string
                            }
                        })
                    }
                >
                    <Text style={styles.buttonText}>Pay with PayHere</Text>
                </TouchableOpacity>
            </View>

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
    container: { flex: 1, padding: 20, backgroundColor: "#fff" },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 5, textAlign: "left" },
    subtitle: { fontSize: 16, marginBottom: 20, textAlign: "left", color: "#555" },
    summaryBox: {
        backgroundColor: "#f9f9f9",
        padding: 15,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    label: { fontSize: 16, marginVertical: 5 },
    button: { backgroundColor: "#FFD700", padding: 15, marginTop: 20, borderRadius: 8 },
    buttonText: { textAlign: "center", fontSize: 18, fontWeight: "bold" },
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        padding: 15,
        borderTopWidth: 1,
        borderColor: "#ddd",
        marginTop: "auto",
    },
});







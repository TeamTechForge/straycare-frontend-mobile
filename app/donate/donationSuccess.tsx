import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DonationSuccess() {
    const router = useRouter();
    const { transactionId } = useLocalSearchParams();

    return (
        <View style={styles.container}>
            {/* Heading at the top */}
            <Text style={styles.title}>Donate & Support♡</Text>

            {/* Middle content box */}
            <View style={styles.middle}>
                <View style={styles.box}>
                    <Ionicons
                        name="checkmark-circle"
                        size={80}
                        color="#FFD700"
                        style={styles.icon}
                    />

                    <Text style={styles.message}>Thank You!</Text>
                    <Text style={styles.subMessage}>Donation Completed Successfully.</Text>

                    <Text style={styles.transaction}>
                        Transaction ID: {transactionId || "123456"}
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push("/donate")}
                    >
                        <Text style={styles.buttonText}>Back</Text>
                    </TouchableOpacity>


                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push("/donate/history")}
                    >
                        <Text style={styles.buttonText}>View Donation History</Text>
                    </TouchableOpacity>

                </View>
            </View>

            {/* Bottom Navigation fixed at bottom */}
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
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    middle: {
        flex: 1,
        justifyContent: "center", // centers box vertically
        alignItems: "center", // centers box horizontally
    },
    box: {
        backgroundColor: "#f9f9f9", // off-white
        borderRadius: 12,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: { marginBottom: 20 },
    message: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
    subMessage: { fontSize: 16, marginBottom: 15 },
    transaction: { fontSize: 14, marginBottom: 30 },
    button: {
        backgroundColor: "#FFD700",
        padding: 12,
        borderRadius: 8,
        marginVertical: 5,
        width: 220,
    },
    buttonText: { textAlign: "center", fontSize: 16, fontWeight: "bold" },
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        padding: 15,
        borderTopWidth: 1,
        borderColor: "#ddd",
    },
});

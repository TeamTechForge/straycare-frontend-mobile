import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function PayHereMock() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvn, setCvn] = useState("");

    return (
        <View style={styles.container}>
            {/* Header */}
            <Text style={styles.header}>PayHere</Text>
            <Text style={styles.subHeader}>Card Details</Text>

            {/* Input fields */}
            <TextInput
                style={styles.input}
                placeholder="Name on Card"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Card Number"
                keyboardType="numeric"
                value={cardNumber}
                onChangeText={setCardNumber}
            />
            <View style={styles.row}>
                <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="MM/YY"
                    value={expiry}
                    onChangeText={setExpiry}
                />
                <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="CVN"
                    keyboardType="numeric"
                    secureTextEntry
                    value={cvn}
                    onChangeText={setCvn}
                />
            </View>

            {/* Pay button */}
            <TouchableOpacity
                style={styles.payButton}
                onPress={() => router.push("/donate/donationSuccess")}
            >
                <Text style={styles.payButtonText}>Pay 1000.00</Text>
            </TouchableOpacity>

            {/* Bottom nav mock */}
            <View style={styles.bottomNav}>
                <Text style={styles.navIcon}>🏠</Text>
                <Text style={styles.navIcon}>👥</Text>
                <Text style={styles.navIcon}>📍</Text>
                <Text style={styles.navIcon}>💬</Text>
                <Text style={styles.navIcon}>👤</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", padding: 20 },
    header: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 5 },
    subHeader: { fontSize: 18, textAlign: "center", marginBottom: 20, color: "#555" },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 15,
    },
    row: { flexDirection: "row", justifyContent: "space-between" },
    halfInput: { flex: 1, marginRight: 10 },
    payButton: {
        backgroundColor: "#F5A623",
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
    },
    payButtonText: { textAlign: "center", fontSize: 18, fontWeight: "bold" },
    bottomNav: {
        flexDirection: "row",
        justifyContent: "space-around",
        padding: 15,
        borderTopWidth: 1,
        borderColor: "#ddd",
        marginTop: "auto",
    },
    navIcon: { fontSize: 20 },
});







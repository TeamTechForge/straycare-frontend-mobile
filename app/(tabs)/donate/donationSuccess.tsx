import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DonationSuccess() {
  const router = useRouter();
  const { transactionId, amount, organization } = useLocalSearchParams();

  const displayTransactionId = transactionId
    ? String(transactionId)
    : "Pending (will be updated from server)";

  const displayAmount = amount ? `Rs. ${parseFloat(amount as string).toFixed(2)}` : "";
  const displayOrganization = organization ? String(organization) : "";

  return (
    <View style={styles.container}>
      <View style={styles.middle}>
        <View style={styles.contentContainer}>
          <Ionicons
            name="checkmark-circle"
            size={90}
            color="#F5A623"
            style={styles.icon}
          />

          <Text style={styles.message}>Thank You!</Text>

          <Text style={styles.subMessage}>
            Donation Completed Successfully
          </Text>

          {displayOrganization ? (
            <Text style={styles.detail}>Organization: {displayOrganization}</Text>
          ) : null}

          {displayAmount ? (
            <Text style={styles.detail}>Amount: {displayAmount}</Text>
          ) : null}

          <Text style={styles.transaction}>
            Transaction ID: {displayTransactionId}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/donate")}
          >
            <Text style={styles.buttonText}>Back to Donate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/donate/history")}
          >
            <Text style={styles.buttonText}>View Donation History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    paddingHorizontal: 20, 
    paddingTop: 10 
  },
  middle: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  icon: { 
    marginBottom: 20 
  },
  message: { 
    fontSize: 26, 
    fontWeight: "bold", 
    marginBottom: 8, 
    color: "#222" 
  },
  subMessage: { 
    fontSize: 16, 
    marginBottom: 30, 
    color: "#555", 
    textAlign: "center" 
  },
  detail: { 
    fontSize: 15, 
    marginBottom: 8, 
    color: "#444", 
    textAlign: "center" 
  },
  transaction: { 
    fontSize: 13, 
    marginTop: 15,    
    marginBottom: 35, 
    color: "#777", 
    textAlign: "center" 
  },
  button: {
    backgroundColor: "#F5A623",
    padding: 14,         
    borderRadius: 8,
    marginVertical: 8,   
    width: 240,          
  },
  buttonText: { 
    textAlign: "center", 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#000" 
  },
});
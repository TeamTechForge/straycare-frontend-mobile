// components/call/IncomingCallModal.tsx

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface IncomingCallModalProps {
  callerName: string;
  callerImage?: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({ callerName, callerImage, onAccept, onDecline }: IncomingCallModalProps) {
  return (
    <Modal visible={true} transparent={true} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Incoming Voice Call</Text>

          <View style={styles.callerInfo}>
            {callerImage ? (
              <Image source={{ uri: callerImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Ionicons name="person" size={40} color="#999" />
              </View>
            )}
            <Text style={styles.callerName}>{callerName}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={onDecline}>
              <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={onAccept}>
              <Ionicons name="call" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-start",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    fontWeight: "500",
  },
  callerInfo: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  placeholderAvatar: {
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  callerName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingHorizontal: 20,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#22C55E",
  },
  declineButton: {
    backgroundColor: "#EF4444",
  },
});

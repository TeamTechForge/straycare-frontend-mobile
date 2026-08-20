// app/call/[callId].tsx

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCall } from "../../contexts/CallContext";
import { CallState } from "../../enums/CallState";

export default function CallScreen() {
  const router = useRouter();
  const { callId } = useLocalSearchParams();
  const { callState, activeCallData, endCall, toggleMute, toggleSpeaker, isMuted, isSpeakerOn } = useCall();

  const [callDuration, setCallDuration] = useState(0);

  // If call ended or no active call data, go back
  useEffect(() => {
    if (callState === CallState.IDLE) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push("/"); // Fallback
      }
    }
  }, [callState]);

  // Call Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callState === CallState.CONNECTED) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    switch (callState) {
      case CallState.OUTGOING:
        return "Calling...";
      case CallState.CONNECTING:
        return "Connecting...";
      case CallState.CONNECTED:
        return formatDuration(callDuration);
      default:
        return "";
    }
  };

  if (!activeCallData) {
    return null; // Will auto-redirect via useEffect
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => { }}>
          {/* We shouldn't allow simple back during an active call without ending it, or maybe pip? Keep it simple */}
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        {activeCallData.profileImage ? (
          <Image source={{ uri: activeCallData.profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <Ionicons name="person" size={60} color="#999" />
          </View>
        )}

        <Text style={styles.name}>{activeCallData.name}</Text>
        <Text style={styles.status}>{getStatusText()}</Text>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Ionicons name={isMuted ? "mic-off" : "mic"} size={28} color={isMuted ? "#fff" : "#111"} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.controlButton, styles.endButton]} onPress={endCall}>
            <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
            onPress={toggleSpeaker}
          >
            <Ionicons name={isSpeakerOn ? "volume-high" : "volume-medium"} size={28} color={isSpeakerOn ? "#fff" : "#111"} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    height: 60,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 10,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100, // Make room for controls
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  placeholderAvatar: {
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 12,
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 24,
  },
  status: {
    fontSize: 18,
    color: "#6B7280",
    fontWeight: "500",
  },
  controlsContainer: {
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  controlButtonActive: {
    backgroundColor: "#4B5563",
  },
  endButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EF4444",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import { useAuth } from "../../contexts/AuthContext";

const BRAND_COLOR = "#F5A623";

export default function VerificationRejectedScreen() {
  const router = useRouter();
  const { user, refreshUser, logout } = useAuth();

  // Refresh status on screen focus in case admin updates it in real-time
  useFocusEffect(
    useCallback(() => {
      console.log("[VerificationRejected] 🔄 Screen focused, refreshing user status...");
      refreshUser();
    }, [refreshUser])
  );

  const handleLogout = async () => {
    try {
      console.log("[VerificationRejected] 🚪 Logging out...");
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResubmit = () => {
    if (user?.role === "ngo") {
      router.replace("/auth/NgoProfileSetup");
    } else if (user?.role === "vet") {
      router.replace("/auth/VetProfileSetup");
    }
  };

  const handleContactSupport = () => {
    router.push("/profile/contactSupport");
  };

  const handleCheckNotifications = async () => {
    try {
      console.log("[VerificationRejected] 🔄 Manual refresh triggered via check notifications...");
      await refreshUser();
    } catch (e) {
      console.error(e);
    }
    router.push("/modals/Notifications" as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCheckNotifications}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Status</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Illustration Area */}
      <View style={styles.illustrationWrapper}>
        <View style={styles.largeCircle}>
          <View style={styles.docCard}>
            <Ionicons name="document-text-outline" size={52} color="#EF4444" />
          </View>

          <View style={styles.closeBadge}>
            <Ionicons name="close-outline" size={24} color="#fff" />
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Verification Rejected</Text>

      {/* Description */}
      <Text style={styles.description}>
        Unfortunately your submitted verification documents were not approved.{"\n"}
        Please review your information and submit the required documents again.
      </Text>

      {/* Action Buttons */}
      <View style={styles.buttonWrapper}>
        <PrimaryButton 
          title="Resubmit Documents" 
          onPress={handleResubmit} 
        />
        
        <View style={{ height: 12 }} />

        <PrimaryButton 
          title="Check for Notifications" 
          variant="outline"
          onPress={handleCheckNotifications} 
        />
      </View>

      {/* Support */}
      <TouchableOpacity style={styles.supportRow} onPress={handleContactSupport}>
        <Ionicons name="headset-outline" size={14} color="#666" />
        <Text style={styles.supportText}>Contact Support</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={[styles.supportRow, { marginTop: 12 }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={14} color="#EF4444" />
        <Text style={[styles.supportText, { color: "#EF4444" }]}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  headerSpacer: {
    width: 22,
  },
  illustrationWrapper: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 28,
  },
  largeCircle: {
    width: 195,
    height: 195,
    borderRadius: 97.5,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  docCard: {
    width: 94,
    height: 110,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  closeBadge: {
    position: "absolute",
    bottom: 36,
    right: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#1D1D1D",
    lineHeight: 30,
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
    color: "#666",
    marginHorizontal: 8,
    marginBottom: 20,
  },
  buttonWrapper: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  supportRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  supportText: {
    fontSize: 13,
    color: "#666",
  },
});

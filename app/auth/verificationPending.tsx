import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { Alert, AppState, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";

const BRAND_COLOR = "#F5A623";

export default function VerificationPendingScreen() {
  const router = useRouter();
  const { socket } = useSocket();
  const { refreshUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      console.log("[VerificationPending] 🚪 Logging out...");
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  // Refresh user status on focus
  useFocusEffect(
    useCallback(() => {
      console.log("[VerificationPending] 🔄 Screen focused, refreshing user status...");
      refreshUser();
    }, [refreshUser])
  );

  // Socket Listener for real-time approval
  useEffect(() => {
    if (!socket) return;

    const onApproved = async (data: any) => {
      console.log("[VerificationPending] 🔔 Received user:approved socket event:", data);
      await refreshUser();
      Alert.alert(
        "Account Approved!",
        "Congratulations! Your account has been verified. Welcome to StrayCare! 🐾"
      );
    };

    socket.on("user:approved", onApproved);

    return () => {
      socket.off("user:approved", onApproved);
    };
  }, [socket, refreshUser]);

  // AppState Listener to sync when returning to app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState === "active") {
        console.log("[VerificationPending] 🔄 App foregrounded, checking approval status...");
        await refreshUser();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshUser]);

  const handleReturnHome = () => {
    alert("Your account is still under review.");
  };

  const handleContactSupport = () => {
    router.push("/profile/contactSupport");
  };

  const handleCheckNotifications = async () => {
    try {
      console.log("[VerificationPending] 🔄 Manual refresh triggered via check notifications...");
      await refreshUser();
    } catch (e) {
      console.error(e);
    }
    router.push("/notifications");
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
            <Ionicons name="document-text-outline" size={52} color="#E8D8B8" />
          </View>

          <View style={styles.searchBadge}>
            <Ionicons name="search-outline" size={20} color="#fff" />
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>We're Checking the{"\n"}Details</Text>

      {/* Description */}
      <Text style={styles.description}>
        Your account is under review by StrayCare admins. We take this step to
        ensure the safety of our community and the animals. You will be notified
        via email once verification is complete.
      </Text>

      {/* Time Note */}
      <View style={styles.noteBox}>
        <Ionicons name="information-circle-outline" size={14} color={BRAND_COLOR} />
        <Text style={styles.noteText}>This usually takes 24-48 hours.</Text>
      </View>

      {/* Action Button - Only show if redirected manually, but following requirement to disable home access */}
      <View style={styles.buttonWrapper}>
        <Text style={{ textAlign: 'center', color: '#888', fontSize: 13, marginBottom: 10 }}>
          Verification usually takes 24-48 hours.
        </Text>
        <PrimaryButton 
          title="Check for Notifications" 
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
    backgroundColor: "#FCF6EA",
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
  searchBadge: {
    position: "absolute",
    bottom: 36,
    right: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND_COLOR,
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
  },
  noteBox: {
    marginTop: 18,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF6E7",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6,
  },
  noteText: {
    color: BRAND_COLOR,
    fontSize: 13,
    fontWeight: "500",
  },
  buttonWrapper: {
    marginTop: 34,
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
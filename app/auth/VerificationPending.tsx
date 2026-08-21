import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { Alert, AppState, StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import VerificationStatusLayout from "../../components/auth/VerificationStatusLayout";
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
    Alert.alert("Your account is still under review.");
  };

  const handleContactSupport = () => {
    router.push("/profile/ContactSupport");
  };



  return (
    <VerificationStatusLayout
      title="We're Checking the\nDetails"
      description="Your account is under review by StrayCare admins. We take this step to ensure the safety of our community and the animals. You will be notified via email once verification is complete."
      circleColor="#FCF6EA"
      iconColor="#E8D8B8"
      badgeColor={BRAND_COLOR}
      badgeIcon="search-outline"
    >
      {/* Time Note */}
      <View style={styles.noteBox}>
        <Ionicons name="information-circle-outline" size={14} color={BRAND_COLOR} />
        <Text style={styles.noteText}>This usually takes 24-48 hours.</Text>
      </View>

      <View style={styles.buttonWrapper}>
        <PrimaryButton
          title="Contact Support"
          onPress={handleContactSupport}
        />
        <View style={{ height: 12 }} />
        <PrimaryButton
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
        />
      </View>
    </VerificationStatusLayout>
  );
}

const styles = StyleSheet.create({
  noteBox: {
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
    marginTop: 20,
    paddingHorizontal: 10,
  },
});

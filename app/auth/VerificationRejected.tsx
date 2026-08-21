import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Alert, StyleSheet, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import VerificationStatusLayout from "../../components/auth/VerificationStatusLayout";
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
      router.replace({ pathname: "/auth/ProfileSetup", params: { role: "ngo" } } as any);
    } else if (user?.role === "vet") {
      router.replace({ pathname: "/auth/ProfileSetup", params: { role: "vet" } } as any);
    }
  };

  const handleContactSupport = () => {
    router.push("/profile/ContactSupport");
  };



  return (
    <VerificationStatusLayout
      title="Verification Rejected"
      description={`Unfortunately your submitted verification documents were not approved.\nPlease review your information and submit the required documents again.`}
      circleColor="#FEE2E2"
      iconColor="#EF4444"
      badgeColor="#EF4444"
      badgeIcon="close-outline"
    >
      <View style={styles.buttonWrapper}>
        <PrimaryButton 
          title="Resubmit Documents" 
          onPress={handleResubmit} 
        />
        
        <View style={{ height: 12 }} />

        <PrimaryButton 
          title="Contact Support" 
          variant="outline"
          onPress={handleContactSupport} 
        />

        <View style={{ height: 12 }} />

        <PrimaryButton 
          title="Sign Out" 
          variant="outline"
          onPress={handleLogout} 
        />
      </View>
    </VerificationStatusLayout>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    paddingHorizontal: 10,
  },
});

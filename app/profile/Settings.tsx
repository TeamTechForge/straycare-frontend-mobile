import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../../constants/config.constants";

import SettingsRow from "../../components/settings/SettingsRow";
import { useAuth } from "../../contexts/AuthContext";
import { pushNotificationService } from "../../services/pushNotificationService";

const BRAND_COLOR = "#F5A623";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [locationEnabled, setLocationEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const loadPreferences = async () => {
      const savedPush = await SecureStore.getItemAsync("pushEnabled");
      if (savedPush !== null) {
        setPushEnabled(savedPush === "true");
      }
      
      const savedLocation = await SecureStore.getItemAsync("locationEnabled");
      if (savedLocation !== null) {
        setLocationEnabled(savedLocation === "true");
      }
    };
    loadPreferences();
  }, []);

  const handlePushToggle = async (enabled: boolean) => {
    setPushEnabled(enabled);
    await SecureStore.setItemAsync("pushEnabled", enabled ? "true" : "false");

    if (enabled) {
      await pushNotificationService.initializePushNotifications();
    } else {
      await pushNotificationService.removeTokenFromBackend();
    }
  };

  const handleLocationToggle = async (enabled: boolean) => {
    setLocationEnabled(enabled);
    await SecureStore.setItemAsync("locationEnabled", enabled ? "true" : "false");
    // In future: update location tracking logic based on this preference
  };

  const handleDeleteAccount = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) return;

      const response = await fetch(`${API_URL}/auth/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await SecureStore.deleteItemAsync("authToken");
        setDeleteModalVisible(false);
        router.replace("/profile/AccountDeleted");
      } else {
        const errorData: any = await response.json();
        Alert.alert("Error", errorData.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
      <View style={styles.card}>
        <SettingsRow
          icon="lock-closed-outline"
          title="Change Password"
          onPress={() => router.push("/profile/ResetPassword")}
        />
        <SettingsRow
          icon="shield-checkmark-outline"
          title="Privacy & Communication"
          onPress={() => router.push("/profile/PrivacySettings")}
        />
        <SettingsRow
          icon="globe-outline"
          title="Language"
          subtitle="English (US)"
          onPress={() => {
            // TODO: later open language selection
          }}
        />
      </View>

      <Text style={styles.sectionTitle}>APP PREFERENCES</Text>
      <View style={styles.card}>
        <SettingsRow
          icon="location-outline"
          title="Location Services"
          showSwitch
          switchValue={locationEnabled}
          onSwitchChange={handleLocationToggle}
        />
        <SettingsRow
          icon="send-outline"
          title="Enable Push Notifications"
          showSwitch
          switchValue={pushEnabled}
          onSwitchChange={handlePushToggle}
        />
      </View>

      <Text style={styles.sectionTitle}>SUPPORT & INFORMATION</Text>
      <View style={styles.card}>
        <SettingsRow
          icon="help-circle-outline"
          title="Help & Support"
          onPress={() => router.push("/profile/HelpSupport")}
        />
        <SettingsRow
          icon="document-text-outline"
          title="Terms & Privacy Policy"
          onPress={() => router.push("/auth/TermsPrivacyScreen")}
        />
        <SettingsRow
          icon="information-circle-outline"
          title="About StrayCare"
          onPress={() => router.push("/profile/About")}
        />
      </View>

      <TouchableOpacity
        style={styles.deleteTextButton}
        onPress={() => setDeleteModalVisible(true)}
      >
        <Ionicons name="trash-outline" size={15} color="#FF5A5A" />
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#F04444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>v2.4.0{"\n"}STRAYCARE RESCUE FOUNDATION</Text>

      {/* DELETE MODAL */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.warningCircle}>
              <Ionicons name="warning-outline" size={30} color={BRAND_COLOR} />
            </View>

            <Text style={styles.modalTitle}>Delete Account?</Text>

            <Text style={styles.modalText}>
              Are you sure you want to delete your StrayCare account? This
              action is permanent. You will lose all saved stray profiles,
              donation history, and preferences immediately.
            </Text>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Text style={styles.deleteButtonText}>Delete Permanently</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 11,
    color: BRAND_COLOR,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  deleteTextButton: {
    marginTop: 28,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  deleteText: {
    color: "#FF5A5A",
    fontSize: 13,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 34,
    borderWidth: 1,
    borderColor: "#FFD6D6",
    backgroundColor: "#FFF2F2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    color: "#F04444",
    fontWeight: "700",
  },
  version: {
    textAlign: "center",
    marginTop: 28,
    color: "#BBB",
    fontSize: 10,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
  },
  warningCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFF4E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  modalText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 22,
  },
  deleteButton: {
    width: "100%",
    backgroundColor: "#F04444",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 14,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  cancelText: {
    fontWeight: "700",
    color: "#333",
  },
});
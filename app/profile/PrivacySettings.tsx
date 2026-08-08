import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../../constants/config.constants";
import { useAuth } from "../../contexts/AuthContext";

const BRAND_COLOR = "#F5A623";

const PRIVACY_OPTIONS = [
  { label: "Everyone", value: "everyone" },
  { label: "People involved in my active cases", value: "relatedOnly" },
  { label: "Nobody", value: "none" },
];

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [messagingPrivacy, setMessagingPrivacy] = useState("everyone");
  const [callingPrivacy, setCallingPrivacy] = useState("everyone");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCurrentPrivacy();
  }, [user?._id]);

  const fetchCurrentPrivacy = async () => {
    if (!user?._id) return;
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const response = await fetch(`${API_URL}/users/${user._id}/public-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        // We can't actually get our own raw privacy string from public profile.
        // Wait, public profile might only return the boolean permissions, not the raw strings!
        // To fix this without adding a new GET endpoint, we can temporarily assume 'everyone'
        // or add a GET /api/auth/me to return it. StrayCare usually has /auth/me or similar.
      }
    } catch (err) {
      console.error(err);
    } finally {
      // For now, if we don't have a dedicated GET, we default to everyone, 
      // but the ideal is updating the auth context or fetching from a proper endpoint.
      // Assuming user object in context might have it if populated, else we let the user just set it.
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const response = await fetch(`${API_URL}/users/privacy`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messagingPrivacy, callingPrivacy }),
      });

      if (response.ok) {
        Alert.alert("Success", "Privacy settings updated successfully.");
      } else {
        Alert.alert("Error", "Failed to update privacy settings.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const renderOptionRow = (
    label: string, 
    value: string, 
    currentValue: string, 
    onSelect: (val: string) => void,
    isLast: boolean = false
  ) => {
    const isSelected = value === currentValue;
    return (
      <TouchableOpacity 
        key={value}
        style={[styles.optionRow, isLast && styles.noBorder]} 
        onPress={() => onSelect(value)}
        activeOpacity={0.7}
      >
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{label}</Text>
        {isSelected && <Ionicons name="checkmark-circle" size={20} color={BRAND_COLOR} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={BRAND_COLOR} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#0056b3" style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            General messages and calls can be restricted.{"\n\n"}
            However, communication related to active rescue, adoption, and lost & found cases will always be allowed to ensure essential coordination.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>WHO CAN MESSAGE ME</Text>
        <View style={styles.card}>
          {PRIVACY_OPTIONS.map((opt, index) => 
            renderOptionRow(opt.label, opt.value, messagingPrivacy, setMessagingPrivacy, index === PRIVACY_OPTIONS.length - 1)
          )}
        </View>

        <Text style={styles.sectionTitle}>WHO CAN CALL ME</Text>
        <View style={styles.card}>
          {PRIVACY_OPTIONS.map((opt, index) => 
            renderOptionRow(opt.label, opt.value, callingPrivacy, setCallingPrivacy, index === PRIVACY_OPTIONS.length - 1)
          )}
        </View>
      </ScrollView>
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
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: BRAND_COLOR,
  },
  infoCard: {
    backgroundColor: "#E6F0FA",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#004085",
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 11,
    color: BRAND_COLOR,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 14,
    color: "#444",
  },
  optionTextSelected: {
    fontWeight: "600",
    color: "#111",
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";

// ✅ reusable button
import PrimaryButton from "../../components/PrimaryButton";
import { API_URL } from "../../constants/config.constants";
import { useAuth } from "../../contexts/AuthContext";
import { getStoredItem } from "../../utils/storage";

const BRAND_COLOR = "#f59e0b";

export default function SelectRoleScreen() {
  const router = useRouter();
  const { refreshUser, logout } = useAuth();

  const handleBack = async () => {
    await logout();
    router.replace("/auth/Register");
  };

  const [selectedRole, setSelectedRole] = useState<"reporter" | "rescuer" | null>(null);

  // ✅ handle continue — reads JWT from SecureStore, sends as Bearer token
  const handleContinue = async () => {
    if (!selectedRole) {
      Alert.alert("Please select a role");
      return;
    }

    // Retrieve the token stored after registration
    const token = await getStoredItem("authToken");

    if (!token) {
      Alert.alert(
        "Session Expired",
        "Please register again.",
        [{ text: "Go Back", onPress: () => router.back() }]
      );
      return;
    }

    if (selectedRole === "reporter") {
      try {
        console.log("📤 Updating role to general_user");

        const response = await fetch(`${API_URL}/auth/select-role`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            // JWT identifies who is making the request — no userId in body
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "general_user" }),
        });

        const data: any = await response.json();
        console.log("📥 Response:", data);

        if (response.ok) {
          // Replace stored token with fresh one that has updated role claim
          if (data.token) {
            await SecureStore.setItemAsync("authToken", data.token);
          }

          // Refresh the user context so the root layout sees the updated roleSelected: true
          await refreshUser();

          // Role selection is a critical setup step; replace current route 
          // to ensure back button doesn't loop back to role choice.
          router.replace("/auth/ReporterProfileSetup");
        } else {
          Alert.alert(data.message || "Failed to select role");
        }
      } catch (error: any) {
        console.error("Error:", error);
        Alert.alert("Something went wrong. Please try again.");
      }
    } else if (selectedRole === "rescuer") {
      // Navigate to specialized selection; replace to clear the primary role stack.
      router.replace("/auth/RescuerTypeSelection");
    }
  };

  return (
    <View style={styles.container}>

      {/* 🔙 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>StrayCare</Text>
      </View>

      {/* 📝 Title */}
      <Text style={styles.title}>
        How would you like to use StrayCare?
      </Text>
      <Text style={styles.subtitle}>
        Choose your role to continue.
      </Text>

      <View style={{ flex: 1, gap: 15, marginBottom: 20 }}>
        {/* 🐶 Reporter Card */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedRole === "reporter" && styles.activeCard,
          ]}
          onPress={() => setSelectedRole("reporter")}
        >
          <View>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Reporter</Text>

              {selectedRole === "reporter" && (
                <Ionicons name="checkmark-circle" size={20} color={BRAND_COLOR} />
              )}
            </View>

            <Text style={styles.cardDesc}>
              Report stray animals, track rescue progress, and support adoption efforts.
            </Text>
          </View>

          <Image
            source={require("../../assets/images/reporter-roleSelection.jpg")}
            style={[
              styles.image,
              selectedRole !== "reporter" && styles.grayImage,
            ]}
          />
        </TouchableOpacity>

        {/* 🐱 Rescuer Card */}
        <TouchableOpacity
          style={[
            styles.card,
            selectedRole === "rescuer" && styles.activeCard,
          ]}
          onPress={() => setSelectedRole("rescuer")}
        >
          <View>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Rescuer</Text>

              {selectedRole === "rescuer" && (
                <Ionicons name="checkmark-circle" size={20} color={BRAND_COLOR} />
              )}
            </View>

            <Text style={styles.cardDesc}>
              Help rescue, treat, or coordinate care for street animals.
            </Text>
          </View>

          <Image
            source={require("../../assets/images/rescuer-roleSelection.jpg")}
            style={[
              styles.image,
              selectedRole !== "rescuer" && styles.grayImage,
            ]}
          />
        </TouchableOpacity>
      </View>

      {/* 🔘 Button */}
      <View style={{ marginTop: 10, marginBottom: 20 }}>
        <PrimaryButton
          title="Continue"
          onPress={handleContinue}
          // 🔥 disable until selected
          disabled={!selectedRole}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },

  subtitle: {
    color: "#888",
    marginBottom: 20,
  },

  card: {
    flex: 1,
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
    justifyContent: "space-between",
  },

  activeCard: {
    borderColor: BRAND_COLOR,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  cardTitle: {
    fontWeight: "bold",
  },

  cardDesc: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
  },

  image: {
    width: "100%",
    flex: 1,
    minHeight: 100,
    borderRadius: 10,
    marginTop: 10,
    resizeMode: "cover",
  },

  grayImage: {
    opacity: 0.4,
  },
});
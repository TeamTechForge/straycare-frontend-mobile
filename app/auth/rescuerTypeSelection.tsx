import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ reusable button
import PrimaryButton from "../../components/PrimaryButton";

const BRAND_COLOR = "#f59e0b";

export default function RescuerTypeScreen() {
  const router = useRouter();

  // ✅ state for selected type
  const [selectedType, setSelectedType] = useState<
    "volunteer" | "ngo" | "vet" | null
  >(null);

  // ✅ handle continue
const handleContinue = () => {
  if (!selectedType) {
    alert("Please select a type");
    return;
  }

  console.log("Selected Rescuer Type:", selectedType);

  // 🔥 role-based navigation
  if (selectedType === "volunteer") {
    router.replace("/auth/ReporterProfileSetupScreen"); 
    // 👉 or create VolunteerProfileSetupScreen later
  } 
  else if (selectedType === "ngo") {
    router.replace("/auth/NGOProfileSetupScreen");
  } 
  else if (selectedType === "vet") {
    router.replace("/auth/VetProfileSetupScreen"); 
    // 👉 create this later
  }
};

  return (
    <View style={styles.container}>
      
      {/* 🔙 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>StrayCare</Text>
      </View>

      {/* 📝 Title */}
      <Text style={styles.title}>Select Your Rescuer Type</Text>
      <Text style={styles.subtitle}>
        This helps us assign the correct permissions.
      </Text>

      {/* 🟡 Volunteer */}
      <TouchableOpacity
        style={[
          styles.card,
          selectedType === "volunteer" && styles.activeCard,
        ]}
        onPress={() => setSelectedType("volunteer")}
      >
        <View style={styles.cardRow}>
          <View style={styles.iconBox}>
            <Ionicons name="hand-left-outline" size={18} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Volunteer</Text>
            <Text style={styles.cardDesc}>
              Assist with animal rescue in your nearby area.
            </Text>
          </View>

          {selectedType === "volunteer" && (
            <Ionicons name="checkmark-circle" size={20} color={BRAND_COLOR} />
          )}
        </View>
      </TouchableOpacity>

      {/* 🟡 NGO */}
      <TouchableOpacity
        style={[
          styles.card,
          selectedType === "ngo" && styles.activeCard,
        ]}
        onPress={() => setSelectedType("ngo")}
      >
        <View style={styles.cardRow}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="office-building" size={18} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>NGO / Shelter Organization</Text>
            <Text style={styles.cardDesc}>
              Manage rescues, shelters, and adoption coordination.
            </Text>
          </View>

          {selectedType === "ngo" && (
            <Ionicons name="checkmark-circle" size={20} color={BRAND_COLOR} />
          )}
        </View>
      </TouchableOpacity>

      {/* 🟡 Veterinarian */}
      <TouchableOpacity
        style={[
          styles.card,
          selectedType === "vet" && styles.activeCard,
        ]}
        onPress={() => setSelectedType("vet")}
      >
        <View style={styles.cardRow}>
          <View style={styles.iconBox}>
            <Ionicons name="medkit-outline" size={18} color="#fff" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Veterinarian</Text>
            <Text style={styles.cardDesc}>
              Provide medical treatment and health updates.
            </Text>
          </View>

          {selectedType === "vet" && (
            <Ionicons name="checkmark-circle" size={20} color={BRAND_COLOR} />
          )}
        </View>
      </TouchableOpacity>

      {/* 🔘 Continue Button */}
      <View style={{ marginTop: 20 }}>
        <PrimaryButton
          title="Continue to Profile Setup"
          onPress={handleContinue}
          disabled={!selectedType} // 🔥 prevents empty selection
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
    backgroundColor: "#f7f7f7",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },

  activeCard: {
    borderColor: BRAND_COLOR,
    backgroundColor: "#fff7ed",
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconBox: {
    backgroundColor: BRAND_COLOR,
    padding: 8,
    borderRadius: 8,
  },

  cardTitle: {
    fontWeight: "bold",
  },

  cardDesc: {
    fontSize: 12,
    color: "#666",
  },
});
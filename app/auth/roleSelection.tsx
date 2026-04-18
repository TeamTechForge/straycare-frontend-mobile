import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ reusable button
import PrimaryButton from "../../components/PrimaryButton";

const BRAND_COLOR = "#f59e0b";

export default function SelectRoleScreen() {
  const router = useRouter();

  // ✅ state to track selected role
  const [selectedRole, setSelectedRole] = useState<"reporter" | "rescuer" | null>(null);

  // ✅ handle continue
  const handleContinue = () => {
    if (!selectedRole) {
      alert("Please select a role");
      return;
    }

    // 🔥 TODO: SEND selectedRole to backend / save in database
    console.log("Selected Role:", selectedRole);

    // 👉 navigate next (example)
    router.replace("/home"); // change later
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
      <Text style={styles.title}>
        How would you like to use StrayCare?
      </Text>
      <Text style={styles.subtitle}>
        Choose your role to continue.
      </Text>

      {/* 🐶 Reporter Card */}
      <TouchableOpacity
        style={[
          styles.card,
          selectedRole === "reporter" && styles.activeCard,
        ]}
        onPress={() => setSelectedRole("reporter")}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Reporter</Text>

          {selectedRole === "reporter" && (
            <Ionicons name="checkmark-circle" size={20} color={BRAND_COLOR} />
          )}
        </View>

        <Text style={styles.cardDesc}>
          Report stray animals, track rescue progress, and support adoption efforts.
        </Text>

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
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Rescuer</Text>

          {selectedRole === "rescuer" && (
            <Ionicons name="checkmark-circle" size={20} color={BRAND_COLOR} />
          )}
        </View>

        <Text style={styles.cardDesc}>
          Help rescue, treat, or coordinate care for street animals.
        </Text>

        <Image
          source={require("../../assets/images/rescuer-roleSelection.jpg")} 
          style={[
            styles.image,
            selectedRole !== "rescuer" && styles.grayImage,
          ]}
        />
      </TouchableOpacity>

      {/* 🔘 Button */}
      <View style={{ marginTop: 20 }}>
        <PrimaryButton
          title="Continue"
          onPress={() => router.push("/auth/rescuerTypeSelection")}

          
          //onPress={handleContinue}
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
    backgroundColor: "#f7f7f7",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
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
    height: 120,
    borderRadius: 10,
  },

  grayImage: {
    opacity: 0.4,
  },
});
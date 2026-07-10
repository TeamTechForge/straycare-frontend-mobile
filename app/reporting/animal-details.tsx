import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";

export default function AnimalDetails() {
  const router = useRouter();

  const [animalType, setAnimalType] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [breed, setBreed] = useState("");
  const [category, setCategory] = useState(""); // FIXED
  const [notes, setNotes] = useState("");
  const [anonymous, setAnonymous] = useState(true);

  const types = ["Dog", "Cat", "Other"];
  const categories = ["Injured", "Abandoned", "Aggressive"]; // FIXED

  const handleNext = () => {
    if (!animalType || !category) {
      Alert.alert("Missing fields", "Please select animal type and category.");
      return;
    }

    router.push({
      pathname: "/reporting/location", // FIXED
      params: {
        animalType,
        breed,
        category,
        notes,
        anonymous: anonymous.toString(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Animal Details</Text>

        {/* ANIMAL TYPE DROPDOWN */}
        <Text style={styles.label}>Animal Type</Text>

        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.dropdownText}>
            {animalType || "Select Animal Type"}
          </Text>
        </TouchableOpacity>

        {showDropdown && (
          <View style={styles.dropdownList}>
            {types.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.dropdownItem}
                onPress={() => {
                  setAnimalType(t);
                  setShowDropdown(false);
                }}
              >
                <Text>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* BREED */}
        <Text style={styles.label}>Breed (optional)</Text>
        <InputField
          placeholder="Enter breed (e.g., Labrador)"
          value={breed}
          onChangeText={setBreed}
        />

        {/* CATEGORY */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.row}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipSelected]}
              onPress={() => setCategory(c)}
            >
              <Text style={styles.chipText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* NOTES */}
        <Text style={styles.label}>Condition Notes (optional)</Text>
        <InputField
          placeholder="Describe the animal's behavior or injuries..."
          value={notes}
          onChangeText={setNotes}
        />

        {/* ANONYMOUS TOGGLE */}
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Report Anonymously</Text>
          <Switch value={anonymous} onValueChange={setAnonymous} />
        </View>
      </ScrollView>

      {/* NEXT BUTTON */}
      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton title="Next Step →" onPress={handleNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  scrollContent: { padding: 20, paddingBottom: 140 },
  header: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  label: { fontSize: 16, marginTop: 20, marginBottom: 8 },

  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 10,
  },
  dropdownText: { fontSize: 14, color: "#333" },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginTop: 5,
    backgroundColor: "white",
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  row: { flexDirection: "row", gap: 10 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#ccc",
  },
  chipSelected: { backgroundColor: "#F5A62333", borderColor: "#F5A623" },
  chipText: { fontSize: 14 },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },

  bottomButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
});

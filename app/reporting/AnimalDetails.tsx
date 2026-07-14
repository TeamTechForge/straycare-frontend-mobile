import { useLocalSearchParams, useRouter } from "expo-router";
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
  const params = useLocalSearchParams();

  // ---------------------------------------------------------
  // 🔥 FIX: Safe param converter (avoids string | string[] error)
  // ---------------------------------------------------------
  const safe = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value || "";

  // ---------------------------------------------------------
  // 🔥 Detect edit mode
  // ---------------------------------------------------------
  const isEditing = safe(params.mode) === "edit";

  // ---------------------------------------------------------
  // 🔥 Pre-fill fields when editing
  // ---------------------------------------------------------
  const [animalType, setAnimalType] = useState(safe(params.animalType));
  const [showDropdown, setShowDropdown] = useState(false);
  const [breed, setBreed] = useState(safe(params.breed));
  const [category, setCategory] = useState(safe(params.category));
  const [notes, setNotes] = useState(safe(params.notes));
  const [anonymous, setAnonymous] = useState(safe(params.anonymous) === "true");

  // ERROR STATES
  const [animalTypeError, setAnimalTypeError] = useState(false);
  const [categoryError, setCategoryError] = useState(false);

  const types = ["Dog", "Cat", "Other"];
  const categories = ["Injured", "Abandoned", "Aggressive"];

  // ---------------------------------------------------------
  // 🔥 Handle Next / Save Changes
  // ---------------------------------------------------------
  const handleNext = () => {
    setAnimalTypeError(false);
    setCategoryError(false);

    if (!animalType) {
      setAnimalTypeError(true);
      Alert.alert("Missing Animal Type", "Please select an animal type.");
      return;
    }

    if (!category) {
      setCategoryError(true);
      Alert.alert("Missing Category", "Please select a category.");
      return;
    }

    // ---------------------------------------------------------
    // 🔥 EDIT MODE: Return directly to Review screen
    // ---------------------------------------------------------
    if (isEditing) {
      router.push({
        pathname: "/reporting/Review",
        params: {
          ...params, // keep all previous values
          animalType,
          breed,
          category,
          notes,
          anonymous: anonymous.toString(),
          mode: "edit", // keep edit mode active
        },
      });
      return;
    }

    // ---------------------------------------------------------
    // 🔥 NORMAL FLOW: Go to Location screen
    // ---------------------------------------------------------
    router.push({
      pathname: "/reporting/Location",
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

        {/* ------------------ ANIMAL TYPE ------------------ */}
        <Text style={styles.label}>Animal Type</Text>

        <TouchableOpacity
          style={[
            styles.dropdown,
            animalTypeError && styles.errorBorder,
          ]}
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
                  setAnimalTypeError(false);
                  setShowDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ------------------ BREED ------------------ */}
        <InputField
          label="Breed (Optional)"
          placeholder="Enter breed (e.g., Labrador)"
          value={breed}
          onChangeText={setBreed}
        />

        {/* ------------------ CATEGORY ------------------ */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.row}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.chip,
                category === c && styles.chipSelected,
                categoryError && !category && styles.errorBorder,
              ]}
              onPress={() => {
                setCategory(c);
                setCategoryError(false);
              }}
            >
              <Text style={styles.chipText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ------------------ NOTES ------------------ */}
        <InputField
          label="Condition Notes (Optional)"
          placeholder="Describe the animal's behavior or injuries..."
          value={notes}
          onChangeText={setNotes}
        />

        {/* ------------------ ANONYMOUS TOGGLE ------------------ */}
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Report Anonymously</Text>
          <Switch value={anonymous} onValueChange={setAnonymous} />
        </View>
      </ScrollView>

      {/* ------------------ BUTTON ------------------ */}
      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton
          title={isEditing ? "Save Changes →" : "Next Step →"}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  scrollContent: { padding: 20, paddingBottom: 140 },

  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
    paddingTop: 22,
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginTop: 16,
    marginBottom: 6,
  },

  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
  },

  dropdownText: { fontSize: 15, color: "#333" },

  dropdownList: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: "white",
  },

  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  dropdownItemText: { fontSize: 15, color: "#333" },

  row: { flexDirection: "row", gap: 10, marginTop: 6 },

  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
  },

  chipSelected: {
    backgroundColor: "#F5A62333",
    borderColor: "#F5A623",
  },

  chipText: { fontSize: 14, color: "#333" },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
  },

  errorBorder: {
    borderColor: "red",
    borderWidth: 2,
  },

  bottomButtonWrapper: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },
});

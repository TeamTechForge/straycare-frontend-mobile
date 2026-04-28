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


export default function AnimalDetails() {     //collects the data for reporting(animal type, breed, category, notes, anonymous) and then passes it to the location screen   
  const router = useRouter();

  // FORM STATE 
  const [animalType, setAnimalType] = useState("");            // Dropdown selection
  const [showDropdown, setShowDropdown] = useState(false);     // Controls dropdown visibility
  const [breed, setBreed] = useState("");                      // Optional text input
  const [category, setCategory] = useState("");                // Required category selection
  const [notes, setNotes] = useState("");                      // Optional notes
  const [anonymous, setAnonymous] = useState(true);            // Toggle for anonymous reporting

 
  const types = ["Dog", "Cat", "Other"];      // Dropdown options
  const categories = ["Injured", "Abandoned", "Aggressive"];

 
  const handleNext = () => {     //Validates required fields (animalType + category).If valid, navigates to the Location screen and passes all collected data as route params
    if (!animalType || !category) {
      Alert.alert("Missing fields", "Please select animal type and category.");
      return;
    }

    router.push({                          // Navigate to next step with collected data
      pathname: "/reporting/location",
      params: {
        animalType,
        breed,
        category,
        notes,
        anonymous: anonymous.toString(),   // Switch returns boolean , convert to string for router
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Animal Details </Text>

        {/* Animal type dropdown */}
        <Text style={styles.label}>Animal Type :</Text>

        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.dropdownText}>
            {animalType || "Select Animal Type"}
          </Text>
        </TouchableOpacity>

        {/* Dropdown list */}
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

        {/* Breed input */}
        <Text style={styles.label}>Breed  (Optional) :</Text>
        <InputField
          placeholder="Enter breed (e.g., Labrador)"
          value={breed}
          onChangeText={setBreed}
        />

        {/* Category selection */}
        <Text style={styles.label}>Category :</Text>
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

        {/* Notes */}
        <Text style={styles.label}>Condition Notes  (Optional) :</Text>
        <InputField
          placeholder="Describe the animal's behavior or injuries..."
          value={notes}
          onChangeText={setNotes}
        />

        {/* Anonymous toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Report Anonymously</Text>
          <Switch value={anonymous} onValueChange={setAnonymous} />
        </View>
      </ScrollView>

      {/* Next */}
      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton title="Next Step →" onPress={handleNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },

  scrollContent: { padding: 20, paddingBottom: 140 },

  header: { fontSize: 26, fontWeight: "700", marginBottom: 20 , textAlign:"center" },

  label: { fontSize: 16, marginTop: 20, marginBottom: 8 },

  // Dropdown styling
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

  // Category chips
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

  // Anonymous toggle
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
  },

  // Bottom button
  bottomButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
});

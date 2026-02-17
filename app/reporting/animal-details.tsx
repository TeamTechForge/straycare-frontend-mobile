import { useRouter } from "expo-router";
import { useState } from "react";
import {
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
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [anonymous, setAnonymous] = useState(true);

  const types = ["Dog", "Cat"];
  const statuses = ["Injured", "Abandoned", "Aggressive"];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Animal Details</Text>

        {/* ANIMAL TYPE DROPDOWN  LIST*/}
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

        {/* breed input field */}
        <Text style={styles.label}>Breed(if known)</Text>
        <InputField
          placeholder="Enter breed (e.g., Labrador)"
          value={breed}
          onChangeText={setBreed}
        />

        
        <Text style={styles.label}>Current Status</Text>
        <View style={styles.row}>
          {statuses.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, status === s && styles.chipSelected]}
              onPress={() => setStatus(s)}
            >
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* special notes field */}
        <Text style={styles.label}>Condition Notes(optional)</Text>
        <InputField
          placeholder="Describe the animal's behavior or injuries..."
          value={notes}
          onChangeText={setNotes}
        />

        {/* anonymous toggle button */}
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Report Anonymously</Text>
          <Switch value={anonymous} onValueChange={setAnonymous} />
        </View>
      </ScrollView>

      {/* bottom navigation to next page button */}
      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton
          title="Next Step →"
          onPress={() =>
            router.push({
              pathname: "/reporting/upload-photos",
              params: {
                animalType,
                breed,
                status,
                notes,
                anonymous: anonymous.toString(),
              },
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 140, 
  },

  header: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  label: { fontSize: 16, marginTop: 20, marginBottom: 8 },

  // dropdown list for animal type styles
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
  },
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

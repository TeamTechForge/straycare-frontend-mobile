import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";

export default function AnimalDetails() {
  const router = useRouter();

  const [animalType, setAnimalType] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [anonymous, setAnonymous] = useState(true);

  const types = ["Dog", "Cat"];
  const statuses = ["Injured", "Abandoned", "Aggressive"];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Animal Details</Text>

      <Text style={styles.label}>Animal Type</Text>
      <View style={styles.row}>
        {types.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.chip, animalType === t && styles.chipSelected]}
            onPress={() => setAnimalType(t)}
          >
            <Text style={styles.chipText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

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

      <Text style={styles.label}>Condition Notes</Text>
      <InputField
        placeholder="Describe the animal's behavior or injuries..."
        value={notes}
        onChangeText={setNotes}
      />

      <View style={styles.toggleRow}>
        <Text style={styles.label}>Report Anonymously</Text>
        <Switch value={anonymous} onValueChange={setAnonymous} />
      </View>

      <PrimaryButton
        title="Next Step →"
        onPress={() =>
          router.push({
            pathname: "/reporting/upload-photos",
            params: {
              animalType,
              status,
              notes,
              anonymous: anonymous.toString(),
            },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  label: { fontSize: 16, marginTop: 20, marginBottom: 8 },
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
});

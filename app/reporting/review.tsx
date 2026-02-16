import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function Review() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const caseId = "STRAY-" + Math.floor(10000 + Math.random() * 90000);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Review Report</Text>

      <Text style={styles.section}>ANIMAL DETAILS</Text>
      <Text style={styles.caseId}>Case ID: {caseId}</Text>

      <Text>Type: {params.animalType}</Text>
      <Text>Status: {params.status}</Text>
      <Text>Notes: {params.notes}</Text>
      <Text>Anonymous: {params.anonymous === "true" ? "Yes" : "No"}</Text>

      <Text style={styles.section}>RESCUE LOCATION</Text>
      <Text>{params.location}</Text>

      <PrimaryButton
        title="Submit Report"
        onPress={() =>
          router.push({
            pathname: "/reporting/success",
            params: { caseId },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  section: { fontSize: 18, marginTop: 20, marginBottom: 10, fontWeight: "600" },
  caseId: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
});

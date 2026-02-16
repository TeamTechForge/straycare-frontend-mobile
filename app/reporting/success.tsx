import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function Success() {
  const { caseId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.check}>✔</Text>

      <Text style={styles.title}>Report Submitted!</Text>
      <Text style={styles.subtitle}>
        Thank you for helping! Our rescue partners have been notified.
      </Text>

      <View style={styles.caseBox}>
        <Text style={styles.caseLabel}>CASE ID</Text>
        <Text style={styles.caseValue}>{caseId}</Text>
      </View>

      <PrimaryButton title="View My Report" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  check: { fontSize: 60, textAlign: "center", marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "700", textAlign: "center" },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 10,
    color: "#555",
  },
  caseBox: {
    backgroundColor: "#F5A62333",
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
  },
  caseLabel: { fontSize: 14, fontWeight: "600" },
  caseValue: { fontSize: 20, fontWeight: "700" },
});

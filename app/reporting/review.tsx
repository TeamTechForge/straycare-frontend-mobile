import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../components";
import typography from "../../constants/typography";

export default function Review() {
  const router = useRouter();
  const { animal, location, description } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review Your Report</Text>

      <Text style={styles.label}>Animal: {animal}</Text>
      <Text style={styles.label}>Location: {location}</Text>
      <Text style={styles.label}>Description: {description}</Text>

      <AppButton title="Submit Report" onPress={() => router.push("./success")} />
      <AppButton title="Back to Edit" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 26, fontFamily: typography.bold, marginBottom: 20 },
  label: { fontSize: 16, fontFamily: typography.regular, marginBottom: 10 },
});

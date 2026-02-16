import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../../components";
import typography from "../../constants/typography";

export default function Success() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Submitted!</Text>
      <Text style={styles.subtitle}>Thank you for helping keep animals safe.</Text>

      <AppButton title="Go Home" onPress={() => router.push("/")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontFamily: typography.bold, marginBottom: 10 },
  subtitle: { fontSize: 16, fontFamily: typography.regular, marginBottom: 20 },
});

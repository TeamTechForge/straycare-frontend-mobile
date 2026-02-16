import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components";
import typography from "../constants/typography";

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Choose an action to continue</Text>

      <AppButton
        title="Report a Case"
        onPress={() => router.push("/reporting/form")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 28, fontFamily: typography.bold, marginBottom: 10 },
  subtitle: { fontSize: 16, fontFamily: typography.regular, marginBottom: 20 },
});

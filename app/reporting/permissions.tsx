import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function Permissions() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>StrayCare needs your help.</Text>

      <Text style={styles.sectionTitle}>Camera & Photos</Text>
      <Text style={styles.text}>
        Add clear photos so rescue teams can identify the animal instantly.
      </Text>

      <Text style={styles.sectionTitle}>Location Access</Text>
      <Text style={styles.text}>
        Share your precise coordinates so rescuers can find the spot quickly.
      </Text>

      <View style={{ marginTop: 40 }}>
        <PrimaryButton
          title="Allow Permissions"
          onPress={() =>
            router.push({
              pathname: "/reporting/location",
              params,
            })
          }
        />

        <View style={{ height: 12 }} />

        <PrimaryButton
          title="Maybe Later"
          variant="outline"
          onPress={() =>
            router.push({
              pathname: "/reporting/location",
              params,
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  sectionTitle: { fontSize: 18, marginTop: 20, fontWeight: "600" },
  text: { fontSize: 14, marginTop: 5, color: "#555" },
});

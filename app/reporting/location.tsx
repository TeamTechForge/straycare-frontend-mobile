import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function Location() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const fakeAddress =
    "124 Maple Street, Northside, Springfield, Illinois 62704";

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder} />

      <Text style={styles.label}>INCIDENT LOCATION</Text>
      <Text style={styles.address}>{fakeAddress}</Text>

      <PrimaryButton
        title="Continue Report →"
        onPress={() =>
          router.push({
            pathname: "/reporting/review",
            params: { ...params, location: fakeAddress },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  mapPlaceholder: {
    height: 300,
    backgroundColor: "#ddd",
    borderRadius: 12,
    marginBottom: 20,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#444" },
  address: { fontSize: 16, marginBottom: 20 },
});

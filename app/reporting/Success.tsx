import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function Success() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const caseId = Array.isArray(params.caseId)
    ? params.caseId[0]
    : params.caseId || "UNKNOWN";

  const lat = Array.isArray(params.lat)
    ? params.lat[0]
    : params.lat || "";

  const lng = Array.isArray(params.lng)
    ? params.lng[0]
    : params.lng || "";

  const animalType = Array.isArray(params.animalType)
    ? params.animalType[0]
    : params.animalType || "";

  const animalPhoto = Array.isArray(params.animalPhoto)
    ? params.animalPhoto[0]
    : params.animalPhoto || "";

  const description = Array.isArray(params.description)
    ? params.description[0]
    : params.description || "";

  return (
    <View style={styles.container}>
      
      {/* SUCCESS ICON */}
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>✓</Text>
      </View>

      {/* TITLE */}
      <Text style={styles.title}>Report Submitted</Text>

      {/* SUBTEXT */}
      <Text style={styles.subtitle}>
        Thank you for helping keep animals safe.
      </Text>

      {/* CASE ID CARD */}
      <View style={styles.caseCard}>
        <Text style={styles.caseLabel}>CASE ID</Text>
        <Text style={styles.caseValue}>{caseId}</Text>
      </View>

      {/* BUTTONS */}
      <View style={styles.buttonGroup}>

        {/* FIND NEAREST RESCUER */}
        {lat && lng ? (
          <PrimaryButton
            title="Find Nearest Rescuer"
            onPress={() =>
              router.push({
                pathname: "/searching-help",
                params: {
                  lat,
                  lng,
                  caseId,
                  animalType,
                  animalPhoto,
                  description,
                },
              })
            }
          />
        ) : null}

        {/* VIEW CASE DETAILS */}
        <PrimaryButton
          title="View Case"
          onPress={() =>
            router.push({
              pathname: "/reporting/CaseDetails",
              params: { caseId },
            })
          }
        />

        {/* BACK TO MAP */}
        <PrimaryButton
          title="Back to Map"
          onPress={() => router.push("/reporting")}
        />

        {/* GO HOME */}
        <PrimaryButton
          title="Go Home"
          onPress={() => router.push("/")}
        />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F5A62333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  iconText: {
    fontSize: 50,
    color: "#F5A623",
    fontWeight: "700",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },

  caseCard: {
    backgroundColor: "#FFF4D1",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },

  caseLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },

  caseValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginTop: 4,
  },

  buttonGroup: {
    width: "100%",
    gap: 14,
  },
});

import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { submitReport } from "../../api/strayApi";
import PrimaryButton from "../../components/PrimaryButton";

export default function Review() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Generate caseId if not passed
  const caseId =
    params.caseId ||
    "STRAY-" + Math.floor(10000 + Math.random() * 90000);

  // Photos (dummy or real)
  const photos = params.photos ? JSON.parse(params.photos as string) : [];

  const handleSubmit = async () => {
    try {
      const reportData = {
        caseId,
        animalType: params.animalType,
        breed: params.breed || "Unknown",
        category: params.category, // FIXED
        status: "Needs Help", // FIXED default status
        notes: params.notes,
        anonymous: params.anonymous === "true",
        location: {
          lat: Number(params.locationLat),
          lng: Number(params.locationLng),
          address: params.locationAddress,
        },
        photos, // dummy for now
      };

      const result = await submitReport(reportData);
      console.log("Report submitted:", result);

      router.push({
        pathname: "/reporting/success",
        params: { caseId },
      });
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* CASE ID */}
      <View style={styles.caseCard}>
        <Text style={styles.caseLabel}>CASE ID</Text>
        <Text style={styles.caseValue}>{caseId}</Text>
      </View>

      {/* MAIN PHOTO */}
      {photos.length > 0 && (
        <Image source={{ uri: photos[0] }} style={styles.mainPhoto} />
      )}

      {/* OTHER PHOTOS */}
      <View style={styles.grid}>
        {photos.slice(1).map((uri: string, index: number) => (
          <Image key={index} source={{ uri }} style={styles.smallPhoto} />
        ))}
      </View>

      {/* ANIMAL DETAILS */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Animal Details</Text>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/reporting/animal-details",
              params,
            })
          }
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Type</Text>
        <Text style={styles.value}>{params.animalType}</Text>

        <Text style={styles.label}>Breed</Text>
        <Text style={styles.value}>{params.breed || "Not specified"}</Text>

        <Text style={styles.label}>Category</Text>
        <Text style={styles.value}>{params.category}</Text>

        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>{params.notes || "No notes"}</Text>

        <Text style={styles.label}>Anonymous</Text>
        <Text style={styles.value}>
          {params.anonymous === "true" ? "Yes" : "No"}
        </Text>
      </View>

      {/* LOCATION */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Rescue Location</Text>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/reporting/location",
              params,
            })
          }
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.value}>{params.locationAddress}</Text>
      </View>

      {/* SUBMIT BUTTON */}
      <PrimaryButton title="Submit Report" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
    backgroundColor: "#fafafa",
  },

  caseCard: {
    backgroundColor: "#FFF4D1",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },

  caseLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },

  caseValue: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },

  mainPhoto: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 30,
  },

  smallPhoto: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  editText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },

  infoBox: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    color: "#444",
    textAlign: "center",
  },

  value: {
    fontSize: 16,
    marginTop: 2,
    textAlign: "center",
  },
});

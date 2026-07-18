import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
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

  // ---------------------------------------------------------
  // SAFE PARAM FIX
  // ---------------------------------------------------------
  const safe = (v: string | string[] | undefined): string =>
    Array.isArray(v) ? v[0] : v || "";

  // ---------------------------------------------------------
  // CASE ID (preserve if editing)
  // ---------------------------------------------------------
  const caseId =
    safe(params.caseId) ||
    "STRAY-" + Math.floor(10000 + Math.random() * 90000);

  // ---------------------------------------------------------
  // PHOTOS
  // ---------------------------------------------------------
  const photos: string[] = params.photos
    ? JSON.parse(safe(params.photos))
    : [];

  // ---------------------------------------------------------
  // SUBMIT REPORT
  // ---------------------------------------------------------
  const handleSubmit = async () => {
    try {
      const reportData = {
        caseId,
        animalType: safe(params.animalType),
        breed: safe(params.breed) || "Unknown",
        category: safe(params.category),
        status: "Needs Help",
        notes: safe(params.notes),
        anonymous: safe(params.anonymous) === "true",
        location: {
          lat: Number(safe(params.locationLat)),
          lng: Number(safe(params.locationLng)),
          address: safe(params.locationAddress),
        },
        photos,
      };

      const result = await submitReport(reportData);
      console.log("Report submitted:", result);

      router.push({
        pathname: "/searching-help",
        params: {
          caseId,
          lat: String(reportData.location.lat),
          lng: String(reportData.location.lng),
          animalType: reportData.animalType,
          animalPhoto: photos[0] || "",
          description: reportData.notes || "",
        },
      });
    } catch (error: any) {
      console.error("Error submitting report:", error);
      Alert.alert("Submission Failed", error?.message || "Failed to submit report. Try again.");
    }
  };

  // ---------------------------------------------------------
  // EDIT HANDLERS
  // ---------------------------------------------------------

  const editAnimalDetails = () => {
    router.push({
      pathname: "/reporting/animal-details",
      params: {
        ...params,
        mode: "edit",
        caseId,
        photos: JSON.stringify(photos),
      },
    });
  };

  const editLocation = () => {
    router.push({
      pathname: "/reporting/location",
      params: {
        ...params,
        mode: "edit",
        caseId,
        photos: JSON.stringify(photos),
      },
    });
  };

  const editPhotos = () => {
    router.push({
      pathname: "/reporting/upload-photos",
      params: {
        ...params,
        mode: "edit",
        caseId,
        photos: JSON.stringify(photos),
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* CASE ID */}
      <View style={styles.caseCard}>
        <Text style={styles.caseLabel}>CASE ID</Text>
        <Text style={styles.caseValue}>{caseId}</Text>
      </View>

      {/* PHOTOS SECTION HEADER */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Photos</Text>
        <TouchableOpacity onPress={editPhotos}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN PHOTO */}
      {photos.length > 0 && (
        <TouchableOpacity onPress={editPhotos}>
          <Image source={{ uri: photos[0] }} style={styles.mainPhoto} />
        </TouchableOpacity>
      )}

      {/* OTHER PHOTOS */}
      <View style={styles.grid}>
        {photos.slice(1).map((uri: string, index: number) => (
          <TouchableOpacity key={index} onPress={editPhotos}>
            <Image source={{ uri }} style={styles.smallPhoto} />
          </TouchableOpacity>
        ))}
      </View>

      {/* ANIMAL DETAILS */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Animal Details</Text>
        <TouchableOpacity onPress={editAnimalDetails}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Type</Text>
        <Text style={styles.value}>{safe(params.animalType)}</Text>

        <Text style={styles.label}>Breed</Text>
        <Text style={styles.value}>{safe(params.breed) || "Not specified"}</Text>

        <Text style={styles.label}>Category</Text>
        <Text style={styles.value}>{safe(params.category)}</Text>

        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>{safe(params.notes) || "No notes"}</Text>

        <Text style={styles.label}>Anonymous</Text>
        <Text style={styles.value}>
          {safe(params.anonymous) === "true" ? "Yes" : "No"}
        </Text>
      </View>

      {/* LOCATION */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Rescue Location</Text>
        <TouchableOpacity onPress={editLocation}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.value}>{safe(params.locationAddress)}</Text>
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
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },

  caseLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },

  caseValue: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
    color: "#333",
    textAlign: "center",
  },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 6,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },

  editText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },

  mainPhoto: {
    width: "100%",
    height: 220,
    borderRadius: 12,
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

  infoBox: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginTop: 10,
  },

  value: {
    fontSize: 16,
    marginTop: 2,
    color: "#333",
  },
});

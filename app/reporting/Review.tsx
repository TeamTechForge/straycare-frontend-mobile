import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { submitReport } from "../../api/stray-api.service";
import PrimaryButton from "../../components/PrimaryButton";

type Category = "Injured" | "Abandoned" | "Aggressive";
const ALLOWED_CATEGORIES: Category[] = ["Injured", "Abandoned", "Aggressive"];

const safe = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] : value || "";

const parseStringArray = (value: string | string[] | undefined): string[] => {
  try {
    const parsed = JSON.parse(safe(value));
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

const parseCategories = (
  categoriesValue: string | string[] | undefined,
  legacyCategoryValue: string | string[] | undefined
): Category[] => {
  const parsed = parseStringArray(categoriesValue);
  const values = parsed.length > 0 ? parsed : safe(legacyCategoryValue).split(",");
  return [...new Set(values.map((value) => value.trim()))].filter(
    (value): value is Category => ALLOWED_CATEGORIES.includes(value as Category)
  );
};

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dljp2yzpb/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "straycare_report_images";

const uploadToCloudinary = async (imageUri: string): Promise<string | null> => {
  if (imageUri.startsWith("http")) return imageUri;

  const data = new FormData();
  data.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "stray_report.jpg",
  } as any);
  data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: data as any,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    });
    const result: any = await response.json();
    return response.ok && result.secure_url ? result.secure_url : null;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return null;
  }
};

export default function Review() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [caseId] = useState(
    () => safe(params.caseId) || "STRAY-" + Math.floor(10000 + Math.random() * 90000)
  );

  // ---------------------------------------------------------
  // PHOTOS
  // ---------------------------------------------------------
  const photos = parseStringArray(params.photos);
  const categories = parseCategories(params.categories, params.category);

  // ---------------------------------------------------------
  // SUBMIT REPORT
  // ---------------------------------------------------------
  const handleSubmit = async () => {
    // Prevent double-submit
    if (isSubmitting) return;

    const animalType = safe(params.animalType).trim();
    const breed = safe(params.breed).trim();
    const notes = safe(params.notes).trim();
    const latitude = Number(safe(params.locationLat));
    const longitude = Number(safe(params.locationLng));
    const validationMessages: string[] = [];

    if (!animalType || animalType.toLowerCase() === "other") {
      validationMessages.push("Enter a specific animal type.");
    } else if (animalType.length > 50) {
      validationMessages.push("Animal type must be 50 characters or fewer.");
    }
    if (breed.length > 60) validationMessages.push("Breed must be 60 characters or fewer.");
    if (categories.length === 0) validationMessages.push("Select at least one category.");
    if (notes.length > 500) validationMessages.push("Condition notes must be 500 characters or fewer.");
    if (photos.length < 1 || photos.length > 5) {
      validationMessages.push("Add between 1 and 5 photos.");
    }
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      validationMessages.push("Select a valid incident location.");
    }

    if (validationMessages.length > 0) {
      Alert.alert("Report Incomplete", validationMessages.join("\n"));
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadedPhotos = await Promise.all(photos.map(uploadToCloudinary));
      const validPhotoUrls = uploadedPhotos.filter(
        (url): url is string => typeof url === "string" && url.length > 0
      );

      if (validPhotoUrls.length !== photos.length) {
        Alert.alert(
          "Upload Failed",
          "One or more photos could not be uploaded. Please try again."
        );
        return;
      }

      const reportData = {
        caseId,
        animalType,
        breed,
        categories,
        category: categories.join(", "),
        status: "Needs Help",
        notes,
        anonymous: safe(params.anonymous) === "true",
        location: {
          lat: latitude,
          lng: longitude,
          address: safe(params.locationAddress).trim(),
        },
        photos: validPhotoUrls,
        preventAutoMatch: true,
      };

      const result = await submitReport(reportData);
      console.log("Report submitted:", result);

      if (result.rescueRequest) {
        // Automatically matched! Go straight to request-status tracking
        router.push({
          pathname: "/request-status",
          params: {
            rescuerId: result.rescueRequest.rescuerId,
            caseId: caseId,
            animalType: reportData.animalType,
            animalPhoto: reportData.photos[0] || "",
            description: reportData.notes || "",
            lat: String(reportData.location.lat),
            lng: String(reportData.location.lng),
            requestId: String(result.rescueRequest._id),
          },
        } as never);
      } else {
        router.push({
          pathname: "/reporting/Success",
          params: {
            caseId,
            animalType: reportData.animalType,
            animalPhoto: reportData.photos[0] || "",
            description: reportData.notes || "",
            lat: String(reportData.location.lat),
            lng: String(reportData.location.lng),
          },
        });
      }
    } catch (error: any) {
      console.error("Error submitting report:", error);

      // Handle duplicate key error
      if (error?.status === 409 || error?.response?.status === 409) {
        Alert.alert(
          "Report Already Exists",
          "This report ID already exists. Please go back and try again.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          "Submission Failed",
          error?.message || "Failed to submit report. Try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // EDIT HANDLERS
  // ---------------------------------------------------------

  const editAnimalDetails = () => {
    router.push({
      pathname: "/reporting/AnimalDetails",
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
      pathname: "/reporting/Location",
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
      pathname: "/reporting/UploadPhotos",
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
        <Text style={styles.value}>{categories.join(", ")}</Text>

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
      <PrimaryButton
        title={isSubmitting ? "Submitting..." : "Submit Report"}
        onPress={handleSubmit}
        disabled={isSubmitting}
      />
      {isSubmitting && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#F5A623" />
          <Text style={styles.loadingText}>Submitting your report...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    paddingBottom: 60,
    paddingTop: 35,
    backgroundColor: "#fafafa",
  },

  caseCard: {
    backgroundColor: "#fdefc3ff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#acababff",
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

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },

  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#F5A623",
  },
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

export default function UploadPhotos() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const safe = (v: string | string[] | undefined): string =>
    Array.isArray(v) ? v[0] : v || "";

  const isEditing = safe(params.mode) === "edit";

  const initialPhotos: string[] = (() => {
    if (!params.photos) return [];
    try {
      const parsed = JSON.parse(safe(params.photos));
      return Array.isArray(parsed)
        ? parsed.filter((value) => typeof value === "string")
        : [];
    } catch {
      return [];
    }
  })();

  const [images, setImages] = useState<string[]>(initialPhotos);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const canAddMore = () => images.length < 5;

  const removeImage = (index: number) => {
    const nextImages = images.filter((_, i) => i !== index);
    setImages(nextImages);
    if (nextImages.length > 0) setPhotoError(null);
  };

  const pickImages = async () => {
    if (!canAddMore()) {
      Alert.alert("Limit reached", "You can upload a maximum of 5 photos.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Gallery access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      const remainingSlots = 5 - images.length;
      const toAdd = uris.slice(0, remainingSlots);

      if (uris.length > remainingSlots) {
        Alert.alert("Limit reached", `Only ${remainingSlots} more photo(s) can be added.`);
      }

      setImages((prev) => [...prev, ...toAdd]);
      if (toAdd.length > 0) setPhotoError(null);
    }
  };

  const openCamera = async () => {
    if (!canAddMore()) {
      Alert.alert("Limit reached", "You can upload a maximum of 5 photos.");
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Camera access is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri]);
      setPhotoError(null);
    }
  };

  const handleNext = () => {
    if (images.length === 0) {
      setPhotoError("Add at least one photo before continuing.");
      return;
    }

    router.push({
      pathname: "/reporting/Review",
      params: {
        ...params,
        mode: isEditing ? "edit" : undefined,
        photos: JSON.stringify(images),
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Upload Photos</Text>
        <Text style={styles.photoLabel}>
          Report Photos <Text style={styles.requiredMark}>*</Text>
        </Text>
        <Text style={styles.subtext}>
          Add between 1 and 5 clear photos. Photos upload when you submit the report.
        </Text>

        <View style={[styles.sectionCard, photoError && styles.errorBorder]}>
          {images.length > 0 ? (
            <Image source={{ uri: images[0] }} style={styles.mainPhoto} />
          ) : (
            <MaterialCommunityIcons name="image-outline" size={60} color="#BBBBBB" />
          )}
        </View>
        {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}

        <View style={styles.sectionCard}>
          <View style={styles.grid}>
            {images.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.smallPhotoBox} />
                <TouchableOpacity
                  accessibilityLabel="Remove photo"
                  style={styles.deleteBadge}
                  onPress={() => removeImage(index)}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}

            {canAddMore() ? (
              <TouchableOpacity
                accessibilityLabel="Add photos from gallery"
                style={styles.addBox}
                onPress={pickImages}
              >
                <MaterialCommunityIcons name="plus" size={35} color="#777777" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          accessibilityLabel="Take a photo"
          style={styles.cameraButton}
          onPress={openCamera}
        >
          <MaterialCommunityIcons name="camera" size={24} color="#FFFFFF" />
          <Text style={styles.cameraButtonText}>Take</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton
          title={isEditing ? "Save Changes" : "Next Step"}
          onPress={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  scrollContent: { padding: 20, paddingBottom: 160 },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
    paddingTop: 22,
  },
  subtext: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 16,
  },
  photoLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 3,
  },
  requiredMark: { color: "#D32F2F", fontWeight: "700" },
  errorText: { color: "#D32F2F", fontSize: 12, marginTop: -2, marginBottom: 6 },
  errorBorder: { borderColor: "#D32F2F", borderWidth: 1.5 },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    alignItems: "center",
  },
  mainPhoto: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageWrapper: { position: "relative" },
  smallPhotoBox: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  deleteBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "rgba(0,0,0,0.7)",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  addBox: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#DDDDDD",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
  },
  cameraButton: {
    position: "absolute",
    bottom: 140,
    right: 20,
    backgroundColor: "#F5A623",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  cameraButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  bottomButtonWrapper: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
  },
});

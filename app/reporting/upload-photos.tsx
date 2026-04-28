import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";

import React, { useState } from "react";
import {
  ActivityIndicator,
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
  const params = useLocalSearchParams();                // Data from previous screens

  // STATE 
  const [images, setImages] = useState<string[]>([]);  // Selected photo URIs
  const [uploading, setUploading] = useState(false);   // Loading state for Next button

  //  HELPERS 
 
  const canAddMore = () => images.length < 5;          // Check if user can add more photos (max 5)

  const removeImage = (index: number) => {             // Remove a selected image by index
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  //  IMAGE PICKER (GALLERY) 
  const pickImages = async () => {
    if (!canAddMore()) {
      Alert.alert("Limit reached", "You can upload a maximum of 5 photos.");
      return;
    }

    // Request gallery permission
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Gallery access is required.");
      return;
    }

    // Open gallery
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);

      // Respect the 5-photo limit
      const remainingSlots = 5 - images.length;
      const toAdd = uris.slice(0, remainingSlots);

      if (uris.length > remainingSlots) {
        Alert.alert(
          "Limit reached",
          `Only ${remainingSlots} more photo(s) can be added.`
        );
      }

      setImages((prev) => [...prev, ...toAdd]);
    }
  };

  // CAMERA 
  const openCamera = async () => {
    if (!canAddMore()) {
      Alert.alert("Limit reached", "You can upload a maximum of 5 photos.");
      return;
    }

    // Request camera permission
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Camera access is required.");
      return;
    }

    // Open camera
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImages((prev) => [...prev, uri]);
    }
  };

  //  NEXT STEP  

  const handleNext = async () => {   // Validates that at least one image is selected.Passes all selected image URIs to the Review screen.
    if (images.length === 0) {
      Alert.alert("No images", "Please select at least one photo.");
      return;
    }

    setUploading(true);

    router.push({
      pathname: "/reporting/review",
      params: {
        ...params,
        photos: JSON.stringify(images),     // Pass URIs as JSON string
      },
    });

    setUploading(false);
  };

  //  UI 
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <Text style={styles.header}>Upload Photos</Text>
        <Text style={styles.subtext}>Add up to 5 photos.</Text>

        {/* MAIN PHOTO PREVIEW  */}
        <View style={styles.mainPhotoBox}>
          {images.length > 0 ? (
            <Image
              source={{ uri: images[0] }}
              style={{ width: "100%", height: "100%", borderRadius: 16 }}
            />
          ) : (
            <MaterialCommunityIcons name="image-outline" size={60} color="#bbb" />
          )}
        </View>

        {/* PHOTO GRID */}
        <View style={styles.grid}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.smallPhotoBox} />

              {/* Delete button */}
              <TouchableOpacity
                style={styles.deleteBadge}
                onPress={() => removeImage(index)}
              >
                <MaterialCommunityIcons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add more photos */}
          {canAddMore() && (
            <TouchableOpacity style={styles.addBox} onPress={pickImages}>
              <MaterialCommunityIcons name="plus" size={35} color="#777" />
            </TouchableOpacity>
          )}
        </View>

        {/* CAMERA BUTTON  */}
        <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
          <MaterialCommunityIcons name="camera" size={25} color="white" />
        </TouchableOpacity>
      </ScrollView>

      {/* NEXT BUTTON  */}
      <View style={styles.bottomButtonWrapper}>
        {uploading ? (
          <ActivityIndicator size="large" color="#FFB700" />
        ) : (
          <PrimaryButton title="Next Step →" onPress={handleNext} />
        )}
      </View>
    </View>
  );
}

// STYLES 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  scrollContent: { padding: 20, paddingBottom: 160 },

  header: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  subtext: { fontSize: 14, color: "#666", marginBottom: 25 },

  mainPhotoBox: {
    width: "100%",
    height: 220,
    backgroundColor: "#eee",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 60,
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
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },

  cameraButton: {
    position: "absolute",
    bottom: 140,
    right: 20,
    backgroundColor: "#FFB700",
    width: 60,
    height: 60,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  bottomButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
});

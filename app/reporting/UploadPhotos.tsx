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

// ☁️ CLOUDINARY UPLOAD HELPER
const uploadToCloudinary = async (imageUri: string) => {
  const data = new FormData();
  
  // Appending the file in the format React Native requires
  data.append('file', {
    uri: imageUri,
    type: 'image/jpeg', 
    name: 'stray_report.jpg',
  } as any); // "as any" bypasses strict TypeScript checking for this specific RN quirk
  
  
  data.append('upload_preset', 'straycare_report_images'); 

  // REPLACE YOUR_CLOUD_NAME with your actual Cloudinary cloud name
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dljp2yzpb/image/upload";

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: data as any,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    const result: any = await response.json();
    return result.secure_url; // Returns the permanent public URL
    
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

export default function UploadPhotos() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const safe = (v: string | string[] | undefined): string =>
    Array.isArray(v) ? v[0] : v || "";

  const isEditing = safe(params.mode) === "edit";

  const initialPhotos: string[] = params.photos
    ? JSON.parse(safe(params.photos))
    : [];

  const [images, setImages] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);

  const canAddMore = () => images.length < 5;

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
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
      const uri = result.assets[0].uri;
      setImages((prev) => [...prev, uri]);
    }
  };

  // 🚀 UPDATED HANDLE NEXT: Uploads to cloud first, then navigates
  const handleNext = async () => {
    if (images.length === 0) {
      Alert.alert("No images", "Please select at least one photo.");
      return;
    }

    setUploading(true);

    try {
      // 1. Upload all local images to Cloudinary at the same time
      const uploadPromises = images.map(uri => {
        // If it's already a cloud URL (e.g., while editing), don't re-upload
        if (uri.startsWith('http')) return uri;
        return uploadToCloudinary(uri);
      });
      
      const uploadedUrls = await Promise.all(uploadPromises);

      // 2. Filter out any uploads that failed
      const validUrls = uploadedUrls.filter((url: any) => url !== null);

      if (validUrls.length === 0) {
        Alert.alert("Upload Failed", "Could not upload images to the server.");
        setUploading(false);
        return;
      }

      // 3. Pass the valid Cloudinary URLs to the next screen
      router.push({
        pathname: "/reporting/Review",
        params: {
          ...params,
          mode: isEditing ? "edit" : undefined,
          photos: JSON.stringify(validUrls),
        },
      });

    } catch (error) {
      Alert.alert("Upload Failed", "Something went wrong uploading your photos.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* HEADER */}
        <Text style={styles.header}>Upload Photos</Text>
        <Text style={styles.subtext}>Add up to 5 photos.</Text>

        {/* MAIN PHOTO */}
        <View style={styles.sectionCard}>
          {images.length > 0 ? (
            <Image source={{ uri: images[0] }} style={styles.mainPhoto} />
          ) : (
            <MaterialCommunityIcons name="image-outline" size={60} color="#bbb" />
          )}
        </View>

        {/* GRID */}
        <View style={styles.sectionCard}>
          <View style={styles.grid}>
            {images.map((uri: string, index: number) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.smallPhotoBox} />
                <TouchableOpacity
                  style={styles.deleteBadge}
                  onPress={() => removeImage(index)}
                >
                  <MaterialCommunityIcons name="close" size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}

            {canAddMore() && (
              <TouchableOpacity style={styles.addBox} onPress={pickImages}>
                <MaterialCommunityIcons name="plus" size={35} color="#777" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* CAMERA BUTTON */}
        <TouchableOpacity style={styles.cameraButton} onPress={openCamera}>
          <MaterialCommunityIcons name="camera" size={25} color="white" />
        </TouchableOpacity>
      </ScrollView>

      {/* NEXT BUTTON */}
      <View style={styles.bottomButtonWrapper}>
        {uploading ? (
          <ActivityIndicator size="large" color="#F5A623" />
        ) : (
          <PrimaryButton
            title={isEditing ? "Save Changes →" : "Next Step →"}
            onPress={handleNext}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  scrollContent: { padding: 20, paddingBottom: 160 },

  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    shadowColor: "#000",
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
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },

  cameraButton: {
    position: "absolute",
    bottom: 140,
    right: 20,
    backgroundColor: "#F5A623",
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
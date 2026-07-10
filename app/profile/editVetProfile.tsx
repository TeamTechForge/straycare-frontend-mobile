import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as DocumentPicker from "expo-document-picker";

import { cacheDirectory, makeDirectoryAsync, copyAsync } from "expo-file-system/legacy";

import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import FileUploadField from "../../components/FileUploadField";
import { API_URL } from "../../constants/config.constants";
import { SafeAreaView } from "react-native-safe-area-context";

const BRAND_COLOR = "#F5A623";

export default function EditVetProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [primaryLocation, setPrimaryLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [licenseDocument, setLicenseDocument] = useState<any>(null);
  const [merchantId, setMerchantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadToCloudinaryIfLocal = async (uriOrAsset: any, token: string) => {
    if (!uriOrAsset) return null;

    let uri = "";
    let name = "upload_file";
    let mimeType = "image/jpeg";

    if (typeof uriOrAsset === "object" && uriOrAsset.uri) {
      uri = uriOrAsset.uri;
      name = uriOrAsset.name || "upload_file";
      mimeType = uriOrAsset.mimeType || "application/octet-stream";
    } else if (typeof uriOrAsset === "string" && (uriOrAsset.startsWith("file://") || uriOrAsset.startsWith("content://"))) {
      uri = uriOrAsset;
      const filename = uri.split("/").pop();
      if (filename) name = filename;
    } else if (typeof uriOrAsset === "string") {
      return uriOrAsset;
    } else {
      return null;
    }

    // Resolve content:// URIs to local file:// URIs using expo-file-system
    if (uri.startsWith("content://")) {
      try {
        const cacheDir = `${cacheDirectory}UploadCache/`;
        await makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => {});
        const localUri = `${cacheDir}${name}`;
        await copyAsync({ from: uri, to: localUri });
        uri = localUri;
      } catch (err) {
        console.error("Failed to copy content URI to local cache:", err);
      }
    }

    const formData = new FormData();
    formData.append("file", {
      uri,
      name,
      type: mimeType,
    } as any);

    const res = await fetch(`${API_URL}/upload/cloudinary`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      let errorMsg = "Failed to upload file to Cloudinary";
      try {
        const errorData = await res.json();
        if (errorData && errorData.message) {
          errorMsg = errorData.message;
        }
      } catch (e) {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    const data = await res.json();
    return data.url;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        if (!token) return;

        const userRes = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        if (userRes.ok) {
          setName(userData.name);
          setPhone(userData.phone || "");
        }

        const profileRes = await fetch(`${API_URL}/profiles/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        if (profileRes.ok) {
          setPrimaryLocation(profileData.primaryLocation || "");
          setBio(profileData.bio || "");
          setClinicName(profileData.clinicName || "");
          setClinicAddress(profileData.clinicAddress || "");
          setLicenseNumber(profileData.licenseNumber || "");
          setYearsOfExperience(profileData.yearsOfExperience || "");
          setProfileImage(profileData.profileImage || null);
          setLicenseDocument(profileData.licenseDocument || null);
          setMerchantId(profileData.merchantId || "");
        }
      } catch (error) {
        console.error("Fetch Vet profile edit data error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setLicenseDocument(result.assets[0]);
      }
    } catch (error) {
      console.error("Document picking error:", error);
      alert("Failed to pick document");
    }
  };

  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const loc = await Location.getCurrentPositionAsync({});
    const address = await Location.reverseGeocodeAsync(loc.coords);

    if (address.length > 0) {
      setPrimaryLocation(`${address[0].city || ""}, ${address[0].country || ""}`);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSubmitting(true);
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("No authorization token found");

      // Upload local files to Cloudinary first
      const uploadedImageUrl = await uploadToCloudinaryIfLocal(profileImage, token);
      const uploadedDocUrl = await uploadToCloudinaryIfLocal(licenseDocument, token);

      const response = await fetch(`${API_URL}/profiles/vet`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          primaryLocation,
          bio,
          clinicName,
          clinicAddress,
          licenseNumber,
          yearsOfExperience,
          profileImage: uploadedImageUrl,
          licenseDocument: uploadedDocUrl,
          merchantId,
        }),
      });

      if (response.ok) {
        alert("Vet profile updated successfully");
        router.back();
      } else {
        const data = await response.json();
        alert(data.message ? `${data.message}${data.error ? `: ${data.error}` : ""}` : "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Update Vet profile error:", error);
      alert(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Vet Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.imageSection}>
          <View style={styles.avatarWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="medkit" size={50} color="#F3E5D8" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraIcon} onPress={handlePickProfileImage}>
              <Ionicons name="camera-outline" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handlePickProfileImage}>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <InputField value={name} onChangeText={setName} placeholder="Enter name" editable={false} />

        <Text style={styles.label}>Primary Location</Text>
        <InputField
          value={primaryLocation}
          onChangeText={setPrimaryLocation}
          placeholder="Enter location"
          icon="location-outline"
          rightIcon="locate-outline"
          onRightIconPress={handleGetLocation}
        />

        <Text style={styles.label}>Phone Number</Text>
        <InputField value={phone} onChangeText={setPhone} placeholder="Enter phone" editable={false} />

        <View style={styles.bioSection}>
          <Text style={styles.bioLabel}>Short Bio</Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="About your experience..."
            multiline
          />
        </View>

        <Text style={styles.label}>Clinic Name</Text>
        <InputField value={clinicName} onChangeText={setClinicName} placeholder="Enter clinic name" />

        <Text style={styles.label}>Clinic Address</Text>
        <InputField value={clinicAddress} onChangeText={setClinicAddress} placeholder="Enter clinic address" />

        <Text style={styles.label}>License Number</Text>
        <InputField value={licenseNumber} onChangeText={setLicenseNumber} placeholder="Enter license number" />

        <Text style={styles.label}>Years of Experience</Text>
        <InputField value={yearsOfExperience} onChangeText={setYearsOfExperience} placeholder="e.g. 10" />

        <Text style={styles.label}>Medical License Document</Text>
        <FileUploadField file={licenseDocument} onPick={handlePickDocument} />
        <Text style={styles.helperText}>Replace license document if needed.</Text>

        <Text style={styles.label}>PayHere Merchant ID</Text>
        <InputField value={merchantId} onChangeText={setMerchantId} placeholder="Enter Merchant ID" />

        <View style={styles.buttonSection}>
          <PrimaryButton
            title={isSubmitting ? "Saving changes..." : "Save Changes"}
            onPress={handleSaveChanges}
            disabled={isSubmitting}
          />
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  contentContainer: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#222" },
  headerSpacer: { width: 22 },
  imageSection: { alignItems: "center", marginBottom: 22 },
  avatarWrapper: { position: "relative", marginBottom: 10 },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: "#E7BFA5", justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#fff" },
  avatarImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: "#fff" },
  cameraIcon: { position: "absolute", right: 4, bottom: 4, width: 28, height: 28, borderRadius: 14, backgroundColor: BRAND_COLOR, justifyContent: "center", alignItems: "center" },
  changePhotoText: { fontSize: 14, color: BRAND_COLOR, fontWeight: "500" },
  bioSection: { marginTop: 8, marginBottom: 14 },
  bioLabel: { fontSize: 13, marginBottom: 6, fontWeight: "500", color: "#333" },
  bioInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, minHeight: 110, backgroundColor: "#f9f9f9", textAlignVertical: "top", fontSize: 15, color: "#222" },
  label: { fontSize: 13, marginBottom: 6, fontWeight: "500", color: "#333" },
  buttonSection: { marginTop: 18 },
  cancelButton: { marginTop: 8, borderWidth: 1, borderColor: "#DDD", borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: "#fff" },
  cancelButtonText: { fontSize: 16, fontWeight: "600", color: "#666" },
  helperText: { fontSize: 11, color: "#888", marginTop: -10, marginBottom: 10 },
});

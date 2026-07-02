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

import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import FileUploadField from "../../components/FileUploadField";
import { API_URL } from "../../constants/Config";
import { SafeAreaView } from "react-native-safe-area-context";

const BRAND_COLOR = "#F5A623";

export default function EditNGOProfileScreen() {
  const router = useRouter();

  const [orgName, setOrgName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [foundedYear, setFoundedYear] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [verificationDocument, setVerificationDocument] = useState<any>(null);
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
    } else if (typeof uriOrAsset === "string" && uriOrAsset.startsWith("file://")) {
      uri = uriOrAsset;
      const filename = uri.split("/").pop();
      if (filename) name = filename;
    } else if (typeof uriOrAsset === "string") {
      return uriOrAsset;
    } else {
      return null;
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
      throw new Error("Failed to upload file to Cloudinary");
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
          setPhone(userData.phone || "");
        }

        const profileRes = await fetch(`${API_URL}/profiles/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();
        if (profileRes.ok) {
          setOrgName(profileData.orgName || "");
          setContactPerson(profileData.contactPerson || "");
          setRegNumber(profileData.regNumber || "");
          setFoundedYear(profileData.foundedYear || "");
          setLocation(profileData.location || "");
          setBio(profileData.bio || "");
          setProfileImage(profileData.profileImage || null);
          setVerificationDocument(profileData.verificationDocument || null);
          setMerchantId(profileData.merchantId || "");
        }
      } catch (error) {
        console.error("Fetch NGO profile edit data error:", error);
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
        setVerificationDocument(result.assets[0]);
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
      setLocation(`${address[0].city || ""}, ${address[0].country || ""}`);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSubmitting(true);
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("No authorization token found");

      // Upload local files to Cloudinary first
      const uploadedImageUrl = await uploadToCloudinaryIfLocal(profileImage, token);
      const uploadedDocUrl = await uploadToCloudinaryIfLocal(verificationDocument, token);

      const response = await fetch(`${API_URL}/profiles/ngo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orgName,
          contactPerson,
          regNumber,
          foundedYear,
          location,
          bio,
          profileImage: uploadedImageUrl,
          verificationDocument: uploadedDocUrl,
          merchantId,
        }),
      });

      if (response.ok) {
        alert("NGO profile updated successfully");
        router.back();
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Update NGO profile error:", error);
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
          <Text style={styles.headerTitle}>Edit NGO Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.imageSection}>
          <View style={styles.avatarWrapper}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="business" size={50} color="#F3E5D8" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraIcon} onPress={handlePickProfileImage}>
              <Ionicons name="camera-outline" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handlePickProfileImage}>
            <Text style={styles.changePhotoText}>Change Organization Logo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Organization Name</Text>
        <InputField value={orgName} onChangeText={setOrgName} placeholder="Enter org name" />

        <Text style={styles.label}>Contact Person</Text>
        <InputField value={contactPerson} onChangeText={setContactPerson} placeholder="Enter contact name" />

        <Text style={styles.label}>Registration Number</Text>
        <InputField value={regNumber} onChangeText={setRegNumber} placeholder="Enter reg number" />

        <Text style={styles.label}>Founded Year</Text>
        <InputField value={foundedYear} onChangeText={setFoundedYear} placeholder="e.g. 2015" />

        <Text style={styles.label}>Phone Number</Text>
        <InputField value={phone} onChangeText={setPhone} placeholder="Enter phone" editable={false} />

        <Text style={styles.label}>Location</Text>
        <InputField
          value={location}
          onChangeText={setLocation}
          placeholder="Enter location"
          icon="location-outline"
          rightIcon="locate-outline"
          onRightIconPress={handleGetLocation}
        />

        <View style={styles.bioSection}>
          <Text style={styles.bioLabel}>Short Bio</Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="About the NGO..."
            multiline
          />
        </View>

        <Text style={styles.label}>Verification Document</Text>
        <FileUploadField file={verificationDocument} onPick={handlePickDocument} />
        <Text style={styles.helperText}>Replace document if needed for re-verification.</Text>

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

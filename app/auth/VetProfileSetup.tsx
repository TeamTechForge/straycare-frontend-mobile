import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as DocumentPicker from "expo-document-picker";

import { cacheDirectory, makeDirectoryAsync, copyAsync } from "expo-file-system/legacy";
import FileUploadField from "../../components/FileUploadField";
import FormSection from "../../components/FormSection";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import ProfileImageUpload from "../../components/ProfileImageUpload";
import { API_URL } from "../../constants/config.constants";

const BRAND_COLOR = "#F5A623";

export default function VetProfileSetupScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [licenseDocument, setLicenseDocument] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [primaryLocation, setPrimaryLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [payHereMerchantId, setPayHereMerchantId] = useState("");
  const [merchantSecret, setMerchantSecret] = useState("");
  const [paymentValidationError, setPaymentValidationError] = useState("");
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
        await makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => { });
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
      body: formData as any,
    });

    if (!res.ok) {
      let errorMsg = "Failed to upload file to Cloudinary";
      try {
        const errorData: any = await res.json();
        if (errorData && errorData.message) {
          errorMsg = errorData.message;
        }
      } catch (e) {
        // use default error message
      }
      throw new Error(errorMsg);
    }

    const data: any = await res.json();
    return data.url;
  };

  const [errors, setErrors] = useState({
    name: "",
    primaryLocation: "",
    phone: "",
    clinicName: "",
    clinicAddress: "",
    licenseNumber: "",
    yearsOfExperience: "",
    licenseDocument: "",
  });

  // Fetch user details on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: any = await response.json();
        if (response.ok) {
          if (data.name) setName(data.name);
          if (data.phone) setPhone(data.phone);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const handlePickProfileImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission to access gallery is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handlePickLicenseDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        // Show the file name in the UI and store the file object
        setLicenseDocument(result.assets[0] as any);
      }
    } catch (error) {
      console.error("Document picking error:", error);
      Alert.alert("Failed to pick document");
    }
  };

  const handleGetPrimaryLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission denied for location.");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

    const address = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    if (address.length > 0) {
      const place = `${address[0].city || ""}, ${address[0].country || ""}`;
      setPrimaryLocation(place);
    }
  };

  const validate = () => {
    const newErrors = {
      name: "",
      primaryLocation: "",
      phone: "",
      clinicName: "",
      clinicAddress: "",
      licenseNumber: "",
      yearsOfExperience: "",
      licenseDocument: "",
    };

    let valid = true;

    if (!name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }

    if (!primaryLocation.trim()) {
      newErrors.primaryLocation = "Primary location is required";
      valid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
      valid = false;
    } else if (phone.trim().length < 8) {
      newErrors.phone = "Enter a valid phone number";
      valid = false;
    }

    if (!clinicName.trim()) {
      newErrors.clinicName = "Clinic name is required";
      valid = false;
    }

    if (!clinicAddress.trim()) {
      newErrors.clinicAddress = "Clinic address is required";
      valid = false;
    }

    if (!licenseNumber.trim()) {
      newErrors.licenseNumber = "License number is required";
      valid = false;
    }

    if (!yearsOfExperience.trim()) {
      newErrors.yearsOfExperience = "Years of experience is required";
      valid = false;
    }

    if (!licenseDocument) {
      newErrors.licenseDocument = "Medical license document is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    // Validate merchant ID and secret relationship
    setPaymentValidationError("");

    if (payHereMerchantId && !merchantSecret) {
      setPaymentValidationError("Merchant Secret is required when Merchant ID is provided.");
      return;
    }

    if (merchantSecret && !payHereMerchantId) {
      setPaymentValidationError("Merchant ID is required when Merchant Secret is provided.");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("No authorization token found");

      // Upload local files to Cloudinary first
      const uploadedImageUrl = await uploadToCloudinaryIfLocal(profileImage, token);
      const uploadedDocUrl = await uploadToCloudinaryIfLocal(licenseDocument, token);

      const response = await fetch(`${API_URL}/profiles/vet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          primaryLocation,
          bio: shortBio,
          clinicName,
          clinicAddress,
          licenseNumber,
          yearsOfExperience,
          profileImage: uploadedImageUrl,
          licenseDocument: uploadedDocUrl,
          merchantId: payHereMerchantId,
          merchantSecret,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        }),
      });

      const data: any = await response.json();
      if (response.ok) {
        await refreshUser();
        router.replace("/auth/CompletedProfileSetup");
      } else {
        Alert.alert(data.message ? `${data.message}${data.error ? `: ${data.error}` : ""}` : "Failed to save profile");
      }
    } catch (error: any) {
      console.error("Profile submission error:", error);
      Alert.alert(error.message || "Something went wrong. Please check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Veterinarian Profile Setup</Text>

        <View style={styles.verificationBadge}>
          <Ionicons name="shield-checkmark-outline" size={12} color={BRAND_COLOR} />
          <Text style={styles.verificationText}>VERIFICATION REQUIRED</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.mainTitle}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>
        Join the rescue community and help animals in need.
      </Text>

      {/* Profile Photo */}
      <ProfileImageUpload
        imageUri={profileImage}
        onPress={handlePickProfileImage}
        label="Upload profile photo"
        icon="medkit-outline"
      />

      {/* Personal Details */}
      <FormSection title="Personal Details">
        <InputField
          label="Name *"
          placeholder="e.g. Alex Thompson"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        <InputField
          label="Primary Location *"
          placeholder="123 Rescue Way, City, State"
          value={primaryLocation}
          onChangeText={setPrimaryLocation}
          icon="location-outline"
          rightIcon="locate-outline"
          onRightIconPress={handleGetPrimaryLocation}
          error={errors.primaryLocation}
        />

        <InputField
          label="Phone Number *"
          placeholder="+1 (555) 000-0000"
          value={phone}
          onChangeText={setPhone}
          icon="call-outline"
          error={errors.phone}
        />

        <View style={styles.bioWrapper}>
          <Text style={styles.fieldLabel}>Short Bio</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us about your mission..."
            value={shortBio}
            onChangeText={(text) => {
              if (text.length <= 150) setShortBio(text);
            }}
            multiline
            placeholderTextColor="#999"
          />
          <Text style={styles.charCount}>{shortBio.length}/150</Text>
        </View>
      </FormSection>

      {/* Clinic & Licensing */}
      <FormSection title="Clinic & Licensing">
        <InputField
          label="Clinic Name *"
          placeholder="e.g. Happy Paws Veterinary Centre"
          value={clinicName}
          onChangeText={setClinicName}
          error={errors.clinicName}
        />

        <InputField
          label="Clinic Address *"
          placeholder="123 Rescue Way, City, State"
          value={clinicAddress}
          onChangeText={setClinicAddress}
          error={errors.clinicAddress}
        />

        <InputField
          label="License Number *"
          placeholder="VET-CD45"
          value={licenseNumber}
          onChangeText={setLicenseNumber}
          error={errors.licenseNumber}
        />

        <InputField
          label="Years of Experience *"
          placeholder="e.g. 5"
          value={yearsOfExperience}
          onChangeText={setYearsOfExperience}
          error={errors.yearsOfExperience}
        />
      </FormSection>

      {/* Medical License Document */}
      <FormSection title="Medical License Document *">
        <FileUploadField file={licenseDocument} onPick={handlePickLicenseDocument} />
        {errors.licenseDocument ? (
          <Text style={styles.errorText}>{errors.licenseDocument}</Text>
        ) : null}

        <Text style={styles.helperText}>
          Documents are used only for professional verification.
        </Text>
      </FormSection>

      {/* Donation Settings */}
      <FormSection title="Donation Settings">
        <Text style={styles.donationDescription}>
          If you wish to receive donations for rescue cases, please provide your payment details below.
        </Text>

        <InputField
          label="Pay Here Merchant ID"
          placeholder="e.g. PH1234567"
          value={payHereMerchantId}
          onChangeText={setPayHereMerchantId}
        />

        <InputField
          label="Merchant Secret"
          placeholder="Enter Merchant Secret"
          value={merchantSecret}
          onChangeText={setMerchantSecret}
          secure={true}
        />

        {paymentValidationError && (
          <Text style={styles.errorText}>{paymentValidationError}</Text>
        )}

        <Text style={styles.helperText}>
          Optional. Required only if you wish to receive donations through your merchant account.
        </Text>
      </FormSection>

      {/* Footer note */}
      <Text style={styles.footerNote}>
        Your data is kept private and secure
      </Text>

      {/* Submit */}
      <PrimaryButton
        title={isSubmitting ? "Uploading files..." : "Submit for Verification"}
        onPress={handleSubmit}
        disabled={isSubmitting}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4E5",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  verificationText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9A6A00",
  },
  mainTitle: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 13,
    color: "#666",
    marginBottom: 22,
    lineHeight: 18,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 22,
  },

  uploadText: {
    marginTop: 10,
    fontSize: 12,
    color: "#9a6a00",
  },
  bioWrapper: {
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 90,
    backgroundColor: "#f9f9f9",
    textAlignVertical: "top",
    fontSize: 14,
    color: "#000",
  },
  charCount: {
    textAlign: "right",
    fontSize: 11,
    color: "#888",
    marginTop: 4,
  },
  helperText: {
    marginTop: 8,
    fontSize: 11,
    color: "#888",
  },
  donationDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    lineHeight: 18,
  },
  footerNote: {
    textAlign: "center",
    fontSize: 11,
    color: "#8a6f3d",
    marginBottom: 6,
    marginTop: 4,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 6,
  },
});
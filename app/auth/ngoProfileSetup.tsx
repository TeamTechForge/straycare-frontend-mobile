import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
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

import FileUploadField from "../../components/FileUploadField";
import FormSection from "../../components/FormSection";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import ProfileImageUpload from "../../components/ProfileImageUpload";
import { API_URL } from "../../constants/Config";

const BRAND_COLOR = "#f59e0b";

export default function ngoProfileSetup() {
  const router = useRouter();

  // ✅ states
  const [orgName, setOrgName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [year, setYear] = useState("");

  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");

  const [image, setImage] = useState<string | null>(null);
  const [document, setDocument] = useState(null);
  const [merchantId, setMerchantId] = useState("");
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

  // Fetch user details on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          if (data.phone) setPhone(data.phone);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // 📸 image picker
  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 📍 location
  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const loc = await Location.getCurrentPositionAsync({});
    const address = await Location.reverseGeocodeAsync(loc.coords);

    if (address.length > 0) {
      setLocation(`${address[0].city}, ${address[0].country}`);
    }
  };

  // 📄 file upload
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        // Show the file name in the UI and store the file object
        setDocument(result.assets[0] as any);
      }
    } catch (error) {
      console.error("Document picking error:", error);
      alert("Failed to pick document");
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate merchant ID and secret relationship
      setPaymentValidationError("");
      
      if (merchantId && !merchantSecret) {
        setPaymentValidationError("Merchant Secret is required when Merchant ID is provided.");
        return;
      }
      
      if (merchantSecret && !merchantId) {
        setPaymentValidationError("Merchant ID is required when Merchant Secret is provided.");
        return;
      }

      setIsSubmitting(true);
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("No authorization token found");

      // Upload local files to Cloudinary first
      const uploadedImageUrl = await uploadToCloudinaryIfLocal(image, token);
      const uploadedDocUrl = await uploadToCloudinaryIfLocal(document, token);

      const response = await fetch(`${API_URL}/profiles/ngo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orgName,
          contactPerson,
          regNumber,
          foundedYear: year,
          location,
          bio,
          profileImage: uploadedImageUrl,
          verificationDocument: uploadedDocUrl,
          merchantId,
          merchantSecret,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        router.replace("/auth/verificationPending");
      } else {
        alert(data.message || "Failed to save profile");
      }
    } catch (error: any) {
      console.error("Profile submission error:", error);
      alert(error.message || "Something went wrong. Please check connection.");
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

        <Text style={styles.headerTitle}>NGO{"\n"}Profile Setup</Text>

        <View style={styles.verificationBadge}>
          <Ionicons name="shield-checkmark-outline" size={12} color={BRAND_COLOR} />
          <Text style={styles.verificationText}>VERIFICATION REQUIRED</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.mainTitle}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>
        Join as an organization to coordinate large-scale rescues.
      </Text>

      {/* Profile Image */}
      <ProfileImageUpload
        imageUri={image}
        onPress={handlePickImage}
        label="Upload organization logo"
        icon="business-outline"
      />

      {/* ORGANIZATION DETAILS */}
      <FormSection title="Organization Details">
        <InputField label="Organization Name *" placeholder="e.g. Save The Strays Foundation" value={orgName} onChangeText={setOrgName} />
        <InputField label="Contact Person Name *" placeholder="e.g. Jane Doe" value={contactPerson} onChangeText={setContactPerson} />
        <InputField label="Registration Number *" placeholder="e.g. NGO-SL-2024-001" value={regNumber} onChangeText={setRegNumber} />
        <InputField label="Founded Year *" placeholder="e.g. 2015" value={year} onChangeText={setYear} keyboardType="numeric" />
      </FormSection>

      {/* CONTACT */}
      <FormSection title="Contact & Location">
        <InputField
          label="Phone Number *"
          placeholder="e.g. +94 11 234 5678"
          value={phone}
          onChangeText={setPhone}
          icon="call-outline"
          keyboardType="phone-pad"
        />

        <InputField
          label="Address *"
          placeholder="e.g. 123 Rescue Road, Colombo 07"
          value={location}
          onChangeText={setLocation}
          icon="location-outline"
          rightIcon="locate-outline"
          onRightIconPress={handleGetLocation}
        />
      </FormSection>

      {/* BIO */}
      <FormSection title="About Organization">
        <View style={styles.bioWrapper}>
          <Text style={styles.fieldLabel}>Organization Bio</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us about your organization's mission and history..."
            value={bio}
            onChangeText={(text) => {
              if (text.length <= 500) setBio(text);
            }}
            multiline
            placeholderTextColor="#999"
          />
          <Text style={styles.charCount}>{bio.length}/500</Text>
        </View>
      </FormSection>

      {/* VERIFICATION */}
      <FormSection title="Verification Documents">
        <FileUploadField file={document} onPick={handlePickFile} />
        <Text style={styles.helperText}>
          Upload NGO registration documents for verification.
        </Text>
      </FormSection>

      {/* PAYMENT */}
      <FormSection title="Donation Settings">
        <Text style={styles.donationDescription}>
          If you wish to receive donations for rescue cases, please provide your payment details below.
        </Text>

        <InputField
          label="Pay Here Merchant ID"
          placeholder="e.g. PH1234567"
          value={merchantId}
          onChangeText={setMerchantId}
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

      {/* BUTTON */}
      <PrimaryButton
        title={isSubmitting ? "Uploading files..." : "Submit for Verification"}
        onPress={handleSubmit}
        disabled={isSubmitting}
      />

      <View style={{ height: 40 }} />
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
    lineHeight: 18,
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
    minHeight: 100,
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
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 6,
  },
});
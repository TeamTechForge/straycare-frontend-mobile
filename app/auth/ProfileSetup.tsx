import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { cacheDirectory, copyAsync, makeDirectoryAsync } from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import BackButton from "../../components/BackButton";
import FileUploadField from "../../components/FileUploadField";
import FormSection from "../../components/FormSection";
import InputField from "../../components/InputField";
import PayHereSetupGuideModal from "../../components/PayHereSetupGuideModal";
import PrimaryButton from "../../components/PrimaryButton";
import ProfileImageUpload from "../../components/ProfileImageUpload";
import { API_URL } from "../../constants/config.constants";
import { useAuth } from "../../contexts/AuthContext";

const BRAND_COLOR = "#f59e0b";

/**
 * ProfileSetupScreen
 * 
 * Handles onboarding profile completion for all user roles: Reporter, Volunteer, NGO, and Vet.
 * It gathers basic info, location, profile images, and verification documents depending on the role.
 * Includes form state persistence in case the user closes the app mid-setup.
 */
export default function ProfileSetupScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>(); // 'reporter', 'volunteer', 'ngo', 'vet'
  const { refreshUser } = useAuth();

  // Basic Details
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState(""); // General, Volunteer, Vet
  const [phone, setPhone] = useState(""); // All
  const [location, setLocation] = useState(""); // All (or primaryLocation for vet)
  const [bio, setBio] = useState(""); // All
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geocodedLocationText, setGeocodedLocationText] = useState("");

  // NGO Specific
  const [orgName, setOrgName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [year, setYear] = useState("");

  // Vet Specific
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");

  // NGO & Vet Common Documents & Payment
  const [verificationDocument, setVerificationDocument] = useState<any>(null); // For NGO reg or Vet License
  const [merchantId, setMerchantId] = useState("");
  const [merchantSecret, setMerchantSecret] = useState("");
  const [payHereAppId, setPayHereAppId] = useState("");
  const [payHereAppSecret, setPayHereAppSecret] = useState("");
  const [paymentValidationError, setPaymentValidationError] = useState("");
  const [showPayHereGuide, setShowPayHereGuide] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // -------------------------------------------------------------
  // FORM PERSISTENCE
  // -------------------------------------------------------------
  // Persist form state across renders or temporary unmounts
  const formPersistRef = useRef<any>(null);

  useEffect(() => {
    formPersistRef.current = {
      profileImage, name, phone, location, bio, coords, geocodedLocationText,
      orgName, contactPerson, regNumber, year,
      clinicName, clinicAddress, licenseNumber, yearsOfExperience,
      merchantId, merchantSecret, payHereAppId, payHereAppSecret
    };
  }, [
    profileImage, name, phone, location, bio, coords, geocodedLocationText,
    orgName, contactPerson, regNumber, year,
    clinicName, clinicAddress, licenseNumber, yearsOfExperience,
    merchantId, merchantSecret, payHereAppId, payHereAppSecret
  ]);

  useEffect(() => {
    const saved = formPersistRef.current;
    if (saved) {
      if (saved.profileImage) setProfileImage(saved.profileImage);
      if (saved.name) setName(saved.name);
      if (saved.phone) setPhone(saved.phone);
      if (saved.location) setLocation(saved.location);
      if (saved.bio) setBio(saved.bio);
      if (saved.coords) setCoords(saved.coords);
      if (saved.geocodedLocationText) setGeocodedLocationText(saved.geocodedLocationText);
      if (saved.orgName) setOrgName(saved.orgName);
      if (saved.contactPerson) setContactPerson(saved.contactPerson);
      if (saved.regNumber) setRegNumber(saved.regNumber);
      if (saved.year) setYear(saved.year);
      if (saved.clinicName) setClinicName(saved.clinicName);
      if (saved.clinicAddress) setClinicAddress(saved.clinicAddress);
      if (saved.licenseNumber) setLicenseNumber(saved.licenseNumber);
      if (saved.yearsOfExperience) setYearsOfExperience(saved.yearsOfExperience);
      if (saved.merchantId) setMerchantId(saved.merchantId);
      if (saved.merchantSecret) setMerchantSecret(saved.merchantSecret);
      if (saved.payHereAppId) setPayHereAppId(saved.payHereAppId);
      if (saved.payHereAppSecret) setPayHereAppSecret(saved.payHereAppSecret);
    }

    const fetchUser = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data: any = await response.json();
        if (response.ok) {
          if (!saved?.name && data.name) setName(data.name);
          if (!saved?.phone && data.phone) setPhone(data.phone);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // -------------------------------------------------------------
  // UTILITIES & HANDLERS
  // -------------------------------------------------------------

  /**
   * Uploads an image or document to the Cloudinary backend API.
   * Handles both standard local URIs and Android 'content://' URIs.
   */
  const uploadToCloudinaryIfLocal = async (uriOrAsset: any, token: string) => {
    if (!uriOrAsset) return null;

    let uri = "";
    let fileName = "upload_file";
    let mimeType = "image/jpeg";

    if (typeof uriOrAsset === "object" && uriOrAsset.uri) {
      uri = uriOrAsset.uri;
      fileName = uriOrAsset.name || "upload_file";
      mimeType = uriOrAsset.mimeType || "application/octet-stream";
    } else if (typeof uriOrAsset === "string" && (uriOrAsset.startsWith("file://") || uriOrAsset.startsWith("content://"))) {
      uri = uriOrAsset;
      const extracted = uri.split("/").pop();
      if (extracted) fileName = extracted;
    } else if (typeof uriOrAsset === "string") {
      return uriOrAsset;
    } else {
      return null;
    }

    if (uri.startsWith("content://")) {
      try {
        const cacheDir = `${cacheDirectory}UploadCache/`;
        await makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => { });
        const localUri = `${cacheDir}${fileName}`;
        await copyAsync({ from: uri, to: localUri });
        uri = localUri;
      } catch (err) {
        console.error("Failed to copy content URI to local cache:", err);
      }
    }

    const formData = new FormData();
    formData.append("file", {
      uri,
      name: fileName,
      type: mimeType,
    } as any);

    const res = await fetch(`${API_URL}/upload/cloudinary`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData as any,
    });

    if (!res.ok) {
      let errorMsg = "Failed to upload file to Cloudinary";
      try {
        const errorData: any = await res.json();
        if (errorData && errorData.message) {
          errorMsg = errorData.message;
        }
      } catch (e) { }
      throw new Error(errorMsg);
    }

    const data: any = await res.json();
    return data.url;
  };

  /** Launches device image picker to select a profile picture */
  const handlePickImage = async () => {
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

  /** Launches device document picker to select PDF or image for verification */
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
      Alert.alert("Failed to pick document");
    }
  };

  /** Prompts user for location permission and sets their coordinates/city */
  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied for location.");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

    const address = await Location.reverseGeocodeAsync(loc.coords);
    if (address.length > 0) {
      const place = `${address[0].city || ""}, ${address[0].country || ""}`;
      setLocation(place);
      setGeocodedLocationText(place);
    }
  };

  /** Validates all required fields before submission based on the user's role */
  const validate = () => {
    let valid = true;
    let newErrors: Record<string, string> = {};

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
      valid = false;
    } else if (!/^[0-9]{10}$/.test(phone.trim())) {
      newErrors.phone = "Must be exactly 10 digits (e.g. 0771234567)";
      valid = false;
    }

    if (!location.trim()) {
      newErrors.location = "Address/Location is required";
      valid = false;
    }

    if (role === "ngo") {
      if (!orgName.trim()) { newErrors.orgName = "Organization name is required"; valid = false; }
      if (!contactPerson.trim()) { newErrors.contactPerson = "Contact person is required"; valid = false; }
      if (!regNumber.trim()) { newErrors.regNumber = "Registration number is required"; valid = false; }
      if (!year.trim()) { newErrors.year = "Founded year is required"; valid = false; }
      if (!verificationDocument) { newErrors.verificationDocument = "Document is required"; valid = false; }
    } else if (role === "vet") {
      if (!name.trim()) { newErrors.name = "Name is required"; valid = false; }
      if (!clinicName.trim()) { newErrors.clinicName = "Clinic name is required"; valid = false; }
      if (!clinicAddress.trim()) { newErrors.clinicAddress = "Clinic address is required"; valid = false; }
      if (!licenseNumber.trim()) { newErrors.licenseNumber = "License number is required"; valid = false; }
      if (!yearsOfExperience.trim()) { newErrors.yearsOfExperience = "Years of experience is required"; valid = false; }
      if (!verificationDocument) { newErrors.verificationDocument = "License document is required"; valid = false; }
    } else {
      if (!name.trim()) { newErrors.name = "Name is required"; valid = false; }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (role === "ngo" || role === "vet") {
      setPaymentValidationError("");
      if (merchantId && !merchantSecret) { setPaymentValidationError("Merchant Secret is required."); return; }
      if (merchantSecret && !merchantId) { setPaymentValidationError("Merchant ID is required."); return; }
      if ((payHereAppId && !payHereAppSecret) || (!payHereAppId && payHereAppSecret)) {
        setPaymentValidationError("Enter both PayHere App ID and App Secret."); return;
      }
    }

    setIsSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("No authorization token found");

      let finalCoords = coords;
      if (location.trim() !== geocodedLocationText.trim()) {
        try {
          const geo = await Location.geocodeAsync(location);
          if (geo.length > 0) {
            finalCoords = { latitude: geo[0].latitude, longitude: geo[0].longitude };
            setCoords(finalCoords);
            setGeocodedLocationText(location);
          }
        } catch (e) { }
      }

      const uploadedImageUrl = await uploadToCloudinaryIfLocal(profileImage, token);
      let uploadedDocUrl = null;
      if (verificationDocument) {
        uploadedDocUrl = await uploadToCloudinaryIfLocal(verificationDocument, token);
      }

      let endpoint = "";
      let bodyData: any = {
        phone,
        location,
        bio,
        profileImage: uploadedImageUrl,
        latitude: finalCoords?.latitude,
        longitude: finalCoords?.longitude,
      };

      if (role === "reporter") {
        endpoint = "/profiles/general";
        bodyData.name = name;
      } else if (role === "volunteer") {
        endpoint = "/profiles/volunteer";
        bodyData.name = name;
      } else if (role === "ngo") {
        endpoint = "/profiles/ngo";
        bodyData = {
          ...bodyData,
          orgName, contactPerson, regNumber, foundedYear: year,
          verificationDocument: uploadedDocUrl,
          merchantId, merchantSecret, payHereAppId, payHereAppSecret
        };
      } else if (role === "vet") {
        endpoint = "/profiles/vet";
        // for vet, backend might expect primaryLocation instead of location. 
        // We will map location to primaryLocation for the API.
        delete bodyData.location;
        bodyData = {
          ...bodyData,
          name, primaryLocation: location, clinicName, clinicAddress,
          licenseNumber, yearsOfExperience, licenseDocument: uploadedDocUrl,
          merchantId, merchantSecret, payHereAppId, payHereAppSecret
        };
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(bodyData),
      });

      const data: any = await response.json();
      if (response.ok) {
        await refreshUser();
        if (role === "ngo" || role === "vet") {
          router.replace("/auth/VerificationPending");
        } else {
          router.replace("/auth/CompletedProfileSetup");
        }
      } else {
        Alert.alert(data.message || "Failed to save profile");
      }
    } catch (error: any) {
      console.error("Profile submission error:", error);
      Alert.alert(error.message || "Something went wrong. Please check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitleInfo = () => {
    switch (role) {
      case "reporter": return { title: "Reporter Profile Setup", sub: "Join the community to help animals and report strays." };
      case "volunteer": return { title: "Volunteer Profile Setup", sub: "Join the rescue community and help animals in need." };
      case "ngo": return { title: "NGO Profile Setup", sub: "Join as an organization to coordinate large-scale rescues." };
      case "vet": return { title: "Veterinarian Profile Setup", sub: "Join the rescue community and help animals in need." };
      default: return { title: "Profile Setup", sub: "Complete your profile to continue." };
    }
  };

  const { title, sub } = getTitleInfo();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.replace(role === "reporter" ? "/auth/RoleSelection" : "/auth/RescuerTypeSelection")} />
        <Text style={styles.headerTitle}>{title}</Text>
        {(role === "ngo" || role === "vet") && (
          <View style={styles.verificationBadge}>
            <Ionicons name="shield-checkmark-outline" size={12} color={BRAND_COLOR} />
            <Text style={styles.verificationText}>VERIFICATION REQUIRED</Text>
          </View>
        )}
      </View>

      <Text style={styles.mainTitle}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>{sub}</Text>

      {/* Profile Image */}
      <ProfileImageUpload
        imageUri={profileImage}
        onPress={handlePickImage}
        label={role === "ngo" ? "Upload organization logo" : "Upload profile photo"}
        icon={role === "ngo" ? "business-outline" : "person-outline"}
      />

      {/* Form Fields dynamically rendered by role */}
      {role === "ngo" ? (
        <FormSection title="Organization Details">
          <InputField label="Organization Name *" placeholder="e.g. Save The Strays" value={orgName} onChangeText={setOrgName} error={errors.orgName} />
          <InputField label="Contact Person Name *" placeholder="e.g. Jane Doe" value={contactPerson} onChangeText={setContactPerson} error={errors.contactPerson} />
          <InputField label="Registration Number *" placeholder="e.g. NGO-SL-2024-001" value={regNumber} onChangeText={setRegNumber} error={errors.regNumber} />
          <InputField label="Founded Year *" placeholder="e.g. 2015" value={year} onChangeText={setYear} keyboardType="numeric" error={errors.year} />
        </FormSection>
      ) : (
        <FormSection title="Personal Details">
          <InputField label="Name *" placeholder="e.g. Alex Johnson" value={name} onChangeText={setName} icon="person-outline" error={errors.name} />
        </FormSection>
      )}

      {/* Common Contact & Location */}
      <FormSection title="Contact & Location">
        <InputField
          label="Phone Number *"
          placeholder="e.g. 0771234567"
          value={phone}
          onChangeText={setPhone}
          icon="call-outline"
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <InputField
          label={role === "vet" ? "Primary Location *" : "Address / Location *"}
          placeholder="e.g. 123 Rescue Road, Colombo"
          value={location}
          onChangeText={setLocation}
          icon="location-outline"
          rightIcon="locate-outline"
          onRightIconPress={handleGetLocation}
          error={errors.location}
        />
      </FormSection>

      {/* Vet Specific Clinic Details */}
      {role === "vet" && (
        <FormSection title="Clinic & Licensing">
          <InputField label="Clinic Name *" placeholder="e.g. Happy Paws Vet" value={clinicName} onChangeText={setClinicName} error={errors.clinicName} />
          <InputField label="Clinic Address *" placeholder="Address..." value={clinicAddress} onChangeText={setClinicAddress} error={errors.clinicAddress} />
          <InputField label="License Number *" placeholder="VET-CD45" value={licenseNumber} onChangeText={setLicenseNumber} error={errors.licenseNumber} />
          <InputField label="Years of Experience *" placeholder="e.g. 5" value={yearsOfExperience} onChangeText={setYearsOfExperience} keyboardType="numeric" error={errors.yearsOfExperience} />
        </FormSection>
      )}

      {/* Bio */}
      <FormSection title={role === "ngo" ? "About Organization" : "Short Bio"}>
        <View style={styles.bioWrapper}>
          <Text style={styles.fieldLabel}>{role === "ngo" ? "Organization Bio" : "Short Bio (Optional)"}</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us a bit about yourself/organization..."
            value={bio}
            onChangeText={(text) => {
              if (text.length <= (role === "ngo" ? 500 : 150)) setBio(text);
            }}
            multiline
            placeholderTextColor="#999"
          />
          <Text style={styles.charCount}>{bio.length}/{role === "ngo" ? "500" : "150"}</Text>
        </View>
      </FormSection>

      {/* Document Upload for Vet/NGO */}
      {(role === "ngo" || role === "vet") && (
        <FormSection title={role === "ngo" ? "Verification Documents *" : "Medical License Document *"}>
          <FileUploadField file={verificationDocument} onPick={handlePickDocument} />
          {errors.verificationDocument ? <Text style={styles.errorText}>{errors.verificationDocument}</Text> : null}
          <Text style={styles.helperText}>
            Documents are used only for professional verification.
          </Text>
        </FormSection>
      )}

      {/* Donation Settings for Vet/NGO */}
      {(role === "ngo" || role === "vet") && (
        <FormSection title="Donation Settings (Optional)">
          <Text style={styles.donationDescription}>
            If you wish to receive donations for rescue cases, please provide your PayHere details below.
          </Text>
          <InputField label="Pay Here Merchant ID" placeholder="e.g. PH1234567" value={merchantId} onChangeText={setMerchantId} />
          <InputField label="Merchant Secret" placeholder="Enter Merchant Secret" value={merchantSecret} onChangeText={setMerchantSecret} secure={true} />
          <Text style={styles.donationDescription}>For recurring donations, provide App ID and App Secret:</Text>
          <InputField label="PayHere App ID" placeholder="App ID" value={payHereAppId} onChangeText={setPayHereAppId} />
          <InputField label="PayHere App Secret" placeholder="App Secret" value={payHereAppSecret} onChangeText={setPayHereAppSecret} secure={true} />
          {paymentValidationError ? <Text style={styles.errorText}>{paymentValidationError}</Text> : null}
          <TouchableOpacity style={styles.payHereHelpLink} onPress={() => setShowPayHereGuide(true)}>
            <Ionicons name="help-circle-outline" size={16} color="#B45309" />
            <Text style={styles.payHereHelpText}>How to get PayHere credentials</Text>
          </TouchableOpacity>
        </FormSection>
      )}

      {/* Submit */}
      <View style={{ marginTop: 20 }}>
        <PrimaryButton
          title={isSubmitting ? "Uploading..." : (role === "ngo" || role === "vet" ? "Submit for Verification" : "Complete Registration")}
          onPress={handleSubmit}
          disabled={isSubmitting}
        />
      </View>
      <Text style={styles.footerNote}>Your data is kept private and secure</Text>
      
      {(role === "ngo" || role === "vet") && (
        <PayHereSetupGuideModal visible={showPayHereGuide} onClose={() => setShowPayHereGuide(false)} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { padding: 16, paddingBottom: 30 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 10 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "600", marginLeft: 10 },
  mainTitle: { textAlign: "center", fontSize: 28, fontWeight: "700", color: "#222", marginBottom: 8 },
  subtitle: { textAlign: "center", fontSize: 13, color: "#666", marginBottom: 22, lineHeight: 18 },
  verificationBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF4E5", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, gap: 4 },
  verificationText: { fontSize: 10, fontWeight: "700", color: "#9A6A00" },
  bioWrapper: { marginTop: 8 },
  fieldLabel: { fontSize: 13, marginBottom: 6, fontWeight: "500" },
  textArea: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 90, backgroundColor: "#f9f9f9", textAlignVertical: "top", fontSize: 14, color: "#000" },
  charCount: { textAlign: "right", fontSize: 11, color: "#888", marginTop: 4 },
  errorText: { color: "red", fontSize: 12, marginTop: 6 },
  helperText: { marginTop: 8, fontSize: 11, color: "#888" },
  donationDescription: { fontSize: 12, color: "#666", marginBottom: 8, lineHeight: 18 },
  payHereHelpLink: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 4 },
  payHereHelpText: { color: "#B45309", fontSize: 12, fontWeight: "700" },
  footerNote: { textAlign: "center", fontSize: 11, color: "#888", marginTop: 12 },
});

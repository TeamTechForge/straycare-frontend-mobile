import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import FileUploadField from "../../components/FileUploadField";
import FormSection from "../../components/FormSection";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import ProfileImageUpload from "../../components/ProfileImageUpload";

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

  // Fetch user details on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        const response = await fetch("http://192.168.8.142:5000/api/auth/me", {
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
  const handlePickFile = () => {
    // TODO: integrate document picker
    console.log("Pick document");
    setDocument("selected");
  };

  const handleSubmit = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const response = await fetch("http://192.168.8.142:5000/api/profiles/ngo", {
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
          profileImage: image,
          verificationDocument: document,
          merchantId,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        router.replace("/auth/verificationPending");
      } else {
        alert(data.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Profile submission error:", error);
      alert("Something went wrong. Please check connection.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NGO Profile Setup</Text>
      </View>

      {/* Profile Image */}
      <ProfileImageUpload
        imageUri={image}
        onPress={handlePickImage}
        label="Upload organization logo"
        icon="business-outline"
/>

      {/* ORGANIZATION DETAILS */}
      <FormSection title="Organization Details">
        <InputField placeholder="Organization Name" value={orgName} onChangeText={setOrgName} />
        <InputField placeholder="Contact Person Name" value={contactPerson} onChangeText={setContactPerson} />
        <InputField placeholder="Registration Number" value={regNumber} onChangeText={setRegNumber} />
        <InputField placeholder="Founded Year" value={year} onChangeText={setYear} />
      </FormSection>

      {/* CONTACT */}
      <FormSection title="Contact & Location">
        <InputField
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          icon="call-outline"
        />

        <InputField
          placeholder="Address"
          value={location}
          onChangeText={setLocation}
          icon="location-outline"
          rightIcon="locate-outline"
          onRightIconPress={handleGetLocation}
        />
      </FormSection>

      {/* BIO */}
      <FormSection title="About">
        <InputField
          placeholder="Short Bio"
          value={bio}
          onChangeText={setBio}
        />
      </FormSection>

      {/* VERIFICATION */}
      <FormSection title="Verification">
        <FileUploadField file={document} onPick={handlePickFile} />
      </FormSection>

      {/* PAYMENT */}
      <FormSection title="Donation Settings">
        <InputField
          placeholder="PayHere Merchant ID"
          value={merchantId}
          onChangeText={setMerchantId}
        />
      </FormSection>

      {/* BUTTON */}
      <PrimaryButton
        title="Submit for Verification"
        onPress={handleSubmit}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  headerTitle: {
    fontWeight: "600",
  },
});
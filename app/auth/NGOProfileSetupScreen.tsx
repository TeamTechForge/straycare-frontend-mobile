import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import PrimaryButton from "../../components/PrimaryButton";
import InputField from "../../components/InputField";
import FormSection from "../../components/FormSection";
import FileUploadField from "../../components/FileUploadField";

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

  const handleSubmit = () => {
    console.log({
      orgName,
      contactPerson,
      regNumber,
      year,
      phone,
      location,
      bio,
      image,
      document,
      merchantId,
    });

    router.replace("/home");
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
      <View style={styles.imageContainer}>
        <View style={styles.avatar}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="leaf-outline" size={40} color="#999" />
          )}
        </View>

        <TouchableOpacity style={styles.editIcon} onPress={handlePickImage}>
          <Ionicons name="pencil" size={14} color="#fff" />
        </TouchableOpacity>
      </View>

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
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e6f4ea",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 120,
    backgroundColor: BRAND_COLOR,
    padding: 6,
    borderRadius: 20,
  },
});
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";

const BRAND_COLOR = "#F5A623";

export default function EditProfileScreen() {
  const router = useRouter();

  // TODO: Replace these hardcoded values with backend/user context data later
  const [fullName, setFullName] = useState("Elena Rodriguez");
  const [email, setEmail] = useState("elena.r@example.com");
  const [phone, setPhone] = useState("+1 (555) 000-0000");
  const [location, setLocation] = useState("Austin, TX");
  const [bio, setBio] = useState(
    "Animal lover and frequent volunteer. Dedicated to making the streets safer for our furry friends."
  );

  // TODO: Replace with real profile image URL from backend later
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
  });

  const handlePickProfileImage = async () => {
    // TODO: Later upload selected image to backend/storage
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission to access gallery is required.");
      return;
    }

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

  const handleGetLocation = async () => {
    // TODO: Later save selected location to backend
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert("Permission denied for location.");
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});

    const address = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    if (address.length > 0) {
      const place = `${address[0].city || ""}, ${address[0].country || ""}`;
      setLocation(place);
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      fullName: "",
      email: "",
      phone: "",
      location: "",
    };

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email address";
      valid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
      valid = false;
    } else if (phone.trim().length < 8) {
      newErrors.phone = "Enter a valid phone number";
      valid = false;
    }

    if (!location.trim()) {
      newErrors.location = "Location is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSaveChanges = () => {
    if (!validateForm()) return;

    // TODO: Send updated profile data to backend here
    console.log("Updated profile data:", {
      fullName,
      email,
      phone,
      location,
      bio,
      profileImage,
    });

    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#222" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Profile</Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* PROFILE IMAGE */}
      <View style={styles.imageSection}>
        <View style={styles.avatarWrapper}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={58} color="#F3E5D8" />
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

      {/* FORM */}
      <Text style={styles.label}>Full Name</Text>
      <InputField
        placeholder="Enter your full name"
        value={fullName}
        onChangeText={setFullName}
        icon="person-outline"
        error={errors.fullName}
      />

      <Text style={styles.label}>Email Address</Text>
      <InputField
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        icon="mail-outline"
        error={errors.email}
      />

      <Text style={styles.label}>Phone Number</Text>
      <InputField
        placeholder="Enter your phone number"
        value={phone}
        onChangeText={setPhone}
        icon="call-outline"
        error={errors.phone}
      />

      <Text style={styles.label}>Location</Text>
      <InputField
        placeholder="Enter your location"
        value={location}
        onChangeText={setLocation}
        icon="location-outline"
        rightIcon="locate-outline"
        onRightIconPress={handleGetLocation}
        error={errors.location}
      />

      <View style={styles.bioSection}>
        <Text style={styles.bioLabel}>Short Bio</Text>
        <TextInput
          style={styles.bioInput}
          placeholder="Tell us about yourself..."
          value={bio}
          onChangeText={(text) => {
            if (text.length <= 180) setBio(text);
          }}
          multiline
          placeholderTextColor="#999"
        />
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.buttonSection}>
        <PrimaryButton title="Save Changes" onPress={handleSaveChanges} />

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        Thank you for being part of the StrayCare community!
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 26,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },
  headerSpacer: {
    width: 22,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 22,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 10,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#E7BFA5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#fff",
  },
  cameraIcon: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  changePhotoText: {
    fontSize: 14,
    color: BRAND_COLOR,
    fontWeight: "500",
  },
  bioSection: {
    marginTop: 8,
    marginBottom: 14,
  },
  bioLabel: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
    color: "#333",
  },
  bioInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 110,
    backgroundColor: "#f9f9f9",
    textAlignVertical: "top",
    fontSize: 15,
    color: "#222",
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
    color: "#333",
  },
  buttonSection: {
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  footerText: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 12,
    color: "#AAA",
  },
});
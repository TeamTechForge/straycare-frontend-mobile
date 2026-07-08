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

import FormSection from "../../components/FormSection";
import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import ProfileImageUpload from "../../components/ProfileImageUpload";
import { API_URL } from "../../constants/Config";
import { useAuth } from "../../contexts/AuthContext";

const BRAND_COLOR = "#F5A623";

export default function VolunteerProfileSetupScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    location: "",
  });

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
      alert("Permission to access gallery is required.");
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

  const handleGetLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert("Permission denied for location.");
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
      setLocation(place);
    }
  };

  const validate = () => {
    const newErrors = {
      name: "",
      phone: "",
      location: "",
    };

    let valid = true;

    if (!name.trim()) {
      newErrors.name = "Name is required";
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
      newErrors.location = "Current location is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const token = await SecureStore.getItemAsync("authToken");
      const response = await fetch(`${API_URL}/profiles/volunteer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          location,
          bio,
          profileImage: profileImage && typeof profileImage === 'object' ? (profileImage as any).uri : profileImage,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        await refreshUser();
        router.replace("/auth/completedProfileSetup");
      } else {
        alert(data.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Profile submission error:", error);
      alert("Something went wrong. Please check connection.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Volunteer{"\n"}Profile Setup</Text>
      </View>

      {/* Title */}
      <Text style={styles.mainTitle}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>
        Join the rescue community and help animals in need.
      </Text>

      {/* Profile Image */}
     <ProfileImageUpload
        imageUri={profileImage}
        onPress={handlePickProfileImage}
      />

      {/* Basic Information */}
      <FormSection title="Basic Information">
        <InputField
          label="Name *"
          placeholder="e.g. Alex Johnson"
          value={name}
          onChangeText={setName}
          error={errors.name}
        />

        <InputField
          label="Phone Number *"
          placeholder="+1 (555) 000-0000"
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
        />

        <InputField
          label="Current Location *"
          placeholder="City, Country"
          value={location}
          onChangeText={setLocation}
          rightIcon="locate-outline"
          onRightIconPress={handleGetLocation}
          error={errors.location}
        />

        <View style={styles.bioWrapper}>
          <Text style={styles.fieldLabel}>Short Bio</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Tell us about yourself and why you want to help animals."
            value={bio}
            onChangeText={(text) => {
              if (text.length <= 150) setBio(text);
            }}
            multiline
            placeholderTextColor="#999"
          />
        </View>
      </FormSection>

      {/* Submit */}
      <PrimaryButton title="Complete Registration" onPress={handleSubmit} />

      <Text style={styles.footerNote}>
        You can update your profile anytime from settings.
      </Text>
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
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
    lineHeight: 18,
  },
  mainTitle: {
    textAlign: "center",
    fontSize: 32,
    fontWeight: "700",
    color: "#222",
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 13,
    color: "#666",
    marginBottom: 26,
    lineHeight: 18,
  },
  imageSection: {
    alignItems: "center",
    marginBottom: 22,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarPlaceholder: {
    width: 95,
    height: 95,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: BRAND_COLOR,
    borderStyle: "dashed",
    backgroundColor: "#FFF9F0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 95,
    height: 95,
    borderRadius: 48,
  },
  editIcon: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
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
  footerNote: {
    textAlign: "center",
    fontSize: 11,
    color: "#888",
    marginTop: 8,
  },
});
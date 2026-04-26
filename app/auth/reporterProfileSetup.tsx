import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import InputField from "../../components/InputField";
import PrimaryButton from "../../components/PrimaryButton";
import ProfileImageUpload from "../../components/ProfileImageUpload";

const BRAND_COLOR = "#f59e0b";

export default function ReporterProfileSetupScreen() {
  const router = useRouter();

  // ✅ states
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    phone: "",
    location: "",
  });

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

  // ✅ image (optional)
  const handlePickImage = async () => {
  // ask permission
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    alert("Permission to access gallery is required!");
    return;
  }

  // open gallery
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (!result.canceled) {
    setImage(result.assets[0].uri);
  }
};

  const handleGetLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    alert("Permission denied for location");
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

  // ✅ validation function
  const validate = () => {
    let valid = true;
    let newErrors = { phone: "", location: "" };

    // 📞 phone validation (required)
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
      valid = false;
    } else if (phone.length < 8) {
      newErrors.phone = "Enter a valid phone number";
      valid = false;
    }

    // 📍 location validation (required)
    if (!location.trim()) {
      newErrors.location = "Location is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // ✅ submit
  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const token = await SecureStore.getItemAsync("authToken");
      const response = await fetch("http://192.168.8.142:5000/api/profiles/general", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          location,
          bio,
          profileImage: image, // Frontend should ideally upload to cloudinary first, but we'll send URI for now as per controller expectation
        }),
      });

      const data = await response.json();
      if (response.ok) {
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
    <View style={styles.container}>
      
      {/* 🔙 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Setup</Text>
      </View>

      {/* 📸 Profile Image (optional) */}
      <ProfileImageUpload
        imageUri={image}
        onPress={handlePickImage}
      />

      {/* 📞 Phone */}
      <Text style={styles.label}>Phone Number *</Text>
      <InputField
        placeholder="+94 77 123 4567"
        value={phone}
        onChangeText={setPhone}
        icon="call-outline"
      />
      {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}

      {/* 📍 Location */}
      <Text style={styles.label}>Location *</Text>
      <InputField
    placeholder="Colombo, Sri Lanka"
    value={location}
    onChangeText={setLocation}
    icon="location-outline"
  />

  {/* 📍 Auto detect button */}
  <TouchableOpacity onPress={handleGetLocation}>
    <Text style={{ color: BRAND_COLOR, marginTop: 5 }}>
      Use Current Location
    </Text>
  </TouchableOpacity>
      {errors.location ? (
        <Text style={styles.error}>{errors.location}</Text>
      ) : null}

      {/* 📝 Bio (optional) */}
      <Text style={styles.label}>Short Bio (Optional)</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Tell us a bit about yourself..."
        value={bio}
        onChangeText={(text) => {
          if (text.length <= 150) setBio(text);
        }}
        multiline
      />
      <Text style={styles.charCount}>{bio.length}/150</Text>

      {/* 🔘 Button */}
      <View style={{ marginTop: 20 }}>
        <PrimaryButton
          title="Complete Registration"
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: "600",
  },

  imageContainer: {
    alignItems: "center",
    marginBottom: 10,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fde7c7",
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

  uploadText: {
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 10,
  },

  subText: {
    textAlign: "center",
    fontSize: 12,
    color: "#888",
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
  },

  textArea: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    height: 90,
    textAlignVertical: "top",
  },

  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },

  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 5,
  },
});
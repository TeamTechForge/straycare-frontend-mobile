import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import PrimaryButton from "../../components/PrimaryButton";

/**
 * Incident Location Picker Component (Web implementation).
 *
 * Provides a manual text input interface for entering incident location addresses on web,
 * where native interactive map dragging is not supported.
 */
export default function LocationPicker() {
  const router = useRouter();
  const [address, setAddress] = useState("");

  /**
   * Navigates to AnimalDetails form screen with entered address data.
   */
  const handleConfirm = () => {
    router.push({
      pathname: "/reporting/AnimalDetails",
      params: {
        locationLat: "0",
        locationLng: "0",
        locationAddress: address,
      },
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* Form Card Container */}
      <View style={styles.card}>
        <Text style={styles.title}>Location</Text>
        <Text style={styles.note}>
          Map selection is only available on mobile. Please enter the address manually:
        </Text>

        {/* Address Input Field */}
        <TextInput
          style={styles.input}
          placeholder="Enter location address"
          value={address}
          onChangeText={setAddress}
          multiline
        />

        {/* Primary Action Button */}
        <PrimaryButton title="Confirm Location" onPress={handleConfirm} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  note: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
});

// components/chat/ChatInput.tsx
// Message input bar with text input, image picker, location share, and send button.

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity, View, Modal, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatLocationPicker from "./ChatLocationPicker";

const BRAND_COLOR = "#F5A623";

type Props = {
  onSendText: (text: string) => void;
  onSendImage?: (uri: string) => void;
  onSendImages: (uris: string[]) => void;
  onSendLocation: (location: { latitude: number; longitude: number; address?: string }) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
};

export default function ChatInput({
  onSendText,
  onSendImage,
  onSendImages,
  onSendLocation,
  onTyping,
  disabled = false,
}: Props) {
  const [text, setText] = useState("");
  const [isLocationSheetVisible, setIsLocationSheetVisible] = useState(false);
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendText(trimmed);
    setText("");
    onTyping(false);
  };

  const handleTextChange = (value: string) => {
    setText(value);
    onTyping(value.length > 0);
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onSendImages(result.assets.map((a) => a.uri));
      }
    } catch (error) {
      console.error("Image picker error:", error);
    }
  };

  const handleShareLocation = () => {
    setIsLocationSheetVisible(true);
  };

  const handleSendCurrentLocation = async () => {
    setIsLocationSheetVisible(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to share your location.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      let address: string | undefined;

      try {
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geocode) {
          address = [geocode.street, geocode.city, geocode.region].filter(Boolean).join(", ");
        }
      } catch {
        // Geocoding failed, send without address
      }

      onSendLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address,
      });
    } catch (error) {
      console.error("Location share error:", error);
      Alert.alert("Error", "Failed to get your location.");
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {/* Attachment buttons */}
      <TouchableOpacity onPress={handlePickImage} style={styles.iconButton} disabled={disabled}>
        <Ionicons name="image-outline" size={22} color="#777" />
      </TouchableOpacity>

      <TouchableOpacity onPress={handleShareLocation} style={styles.iconButton} disabled={disabled}>
        <Ionicons name="location-outline" size={22} color="#777" />
      </TouchableOpacity>

      {/* Text input */}
      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        placeholderTextColor="#999"
        value={text}
        onChangeText={handleTextChange}
        multiline
        maxLength={2000}
        editable={!disabled}
      />

      {/* Send button */}
      <TouchableOpacity
        onPress={handleSend}
        style={[styles.sendButton, !text.trim() && styles.sendDisabled]}
        disabled={!text.trim() || disabled}
      >
        <Ionicons name="send" size={20} color={text.trim() ? "#fff" : "#ccc"} />
      </TouchableOpacity>

      <Modal
        visible={isLocationSheetVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLocationSheetVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsLocationSheetVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="location" size={32} color={BRAND_COLOR} />
            </View>
            <Text style={styles.modalTitle}>Share Location</Text>
            <Text style={styles.modalDesc}>How would you like to share your location?</Text>
            
            <View style={styles.modalButtonGroup}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalPrimaryButton]} 
                onPress={handleSendCurrentLocation}
              >
                <Text style={styles.modalButtonTextPrimary}>Send Current Location</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.modalSecondaryButton]} 
                onPress={() => {
                  setIsLocationSheetVisible(false);
                  setIsMapPickerVisible(true);
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Choose on Map</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]} 
                onPress={() => setIsLocationSheetVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ChatLocationPicker 
        visible={isMapPickerVisible}
        onCancel={() => setIsMapPickerVisible(false)}
        onSelect={(loc) => {
          setIsMapPickerVisible(false);
          onSendLocation(loc);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    color: "#111",
    marginHorizontal: 6,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BRAND_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  sendDisabled: {
    backgroundColor: "#E5E7EB",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF3C7", // lighter brand color
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 15,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  modalButtonGroup: {
    width: "100%",
    gap: 12,
  },
  modalButton: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  modalPrimaryButton: {
    backgroundColor: BRAND_COLOR,
  },
  modalSecondaryButton: {
    backgroundColor: "#10B981", // Emerald green for map action
  },
  modalCancelButton: {
    backgroundColor: "#F3F4F6",
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
  },
});

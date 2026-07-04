// components/chat/ChatInput.tsx
// Message input bar with text input, image picker, location share, and send button.

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useState } from "react";
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

const BRAND_COLOR = "#F5A623";

type Props = {
  onSendText: (text: string) => void;
  onSendImage: (uri: string) => void;
  onSendLocation: (location: { latitude: number; longitude: number; address?: string }) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
};

export default function ChatInput({
  onSendText,
  onSendImage,
  onSendLocation,
  onTyping,
  disabled = false,
}: Props) {
  const [text, setText] = useState("");

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
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        onSendImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
    }
  };

  const handleShareLocation = async () => {
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
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 8,
    paddingBottom: 28,
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
});

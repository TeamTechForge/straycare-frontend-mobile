import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BackButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function BackButton({ onPress, style }: BackButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.iconBtn, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="arrow-back" size={22} color="#062425" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f4f3f3",
    alignItems: "center",
    justifyContent: "center",
  },
});

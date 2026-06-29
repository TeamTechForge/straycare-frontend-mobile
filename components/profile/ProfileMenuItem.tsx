import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  isVerification?: boolean;
};

export default function ProfileMenuItem({ icon, label, onPress, disabled, isVerification }: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        disabled && styles.disabledItem,
        isVerification && styles.verificationItem
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.7}
    >
      <Ionicons
        name={icon}
        size={16}
        color={isVerification ? "#F5A623" : (disabled ? "#AAA" : "#555")}
      />
      <Text style={[
        styles.menuItemText,
        disabled && styles.disabledText,
        isVerification && styles.verificationText
      ]}>
        {label}
      </Text>
      {disabled && (
        <Ionicons name="lock-closed-outline" size={12} color="#AAA" style={{ marginLeft: "auto" }} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  menuItemText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  disabledItem: {
    opacity: 0.6,
  },
  disabledText: {
    color: "#AAA",
  },
  verificationItem: {
    backgroundColor: "#FFF4E5",
    borderRadius: 8,
    paddingHorizontal: 8,
    marginTop: 8,
    borderBottomWidth: 0,
  },
  verificationText: {
    color: "#F5A623",
    fontWeight: "700",
  },
});
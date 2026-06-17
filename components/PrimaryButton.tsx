import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "filled" | "outline";
  disabled?: boolean;
};

export default function PrimaryButton({
  title,
  onPress,
  variant = "filled",
  disabled = false,
}: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "outline" && styles.outlineButton,
        disabled && styles.disabledButton,
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 0.5 : 0.8}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          variant === "outline" && styles.outlineText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#F5A623",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
    alignSelf: "stretch",
  },
  text: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  outlineButton: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#F5A623",
  },
  outlineText: {
    color: "#000000",
  },
  disabledButton: {
    backgroundColor: "#d9d9d9",
    opacity: 0.6,
  },
});

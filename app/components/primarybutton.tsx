import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "filled" | "outline";
};

export default function PrimaryButton({
  title,
  onPress,
  variant = "filled",
}: Props) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "outline" && styles.outlineButton,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
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
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  outlineButton: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#F5A623",
  },
  outlineText: {
    color: "#F5A623",
  },
});

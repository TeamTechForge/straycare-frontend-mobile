import { StyleSheet, Text, TouchableOpacity } from "react-native";
import colors from "../constants/colors";
import typography from "../constants/typography";

interface AppButtonProps {
  title: string;
  onPress: () => void;
}

export default function AppButton({ title, onPress }: AppButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  text: {
    color: "#000",
    fontSize: 16,
    fontFamily: typography.medium,
  },
});

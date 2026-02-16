import { StyleSheet, TextInput } from "react-native";
import colors from "../constants/colors";
import typography from "../constants/typography";

interface AppInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
}

export default function AppInput({ value, onChangeText, placeholder, multiline }: AppInputProps) {
  return (
    <TextInput
      style={[styles.input, multiline && { height: 100 }]}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      placeholderTextColor="#888"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontFamily: typography.regular,
    fontSize: 15,
  },
});

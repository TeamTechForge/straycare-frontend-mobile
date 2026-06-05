import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  error?: string; // ✅ NEW
};

export default function InputField({
  placeholder,
  value,
  onChangeText,
  secure = false,
  error,
}: Props) {

  const [showPassword, setShowPassword] = useState(false); // ✅ NEW

  return (
    <View style={styles.container}>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !showPassword} // ✅ UPDATED
          placeholderTextColor="#999"
        />

        {/* 👁️ Eye Icon */}
        {secure && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.icon}
          >
            <Feather
              name={showPassword ? "eye" : "eye-off"}
              size={18}
              color="#777"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ❌ Error Message */}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },

  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    paddingRight: 40, // space for icon
  },

  icon: {
    position: "absolute",
    right: 12,
  },

  error: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});
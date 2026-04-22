import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  label?: string;
  error?: string;
};

export default function InputField({
  placeholder,
  value,
  onChangeText,
  secure = false,
  icon,
  rightIcon,
  onRightIconPress,
  label,
  error,
}: Props) {

  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>

      {/* LABEL */}
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.inputWrapper}>
        
        {/* LEFT ICON */}
        {icon && (
          <View style={styles.leftIcon}>
            <Ionicons name={icon} size={18} color="#777" />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            icon && { paddingLeft: 40 }, // space for icon
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !showPassword}
          placeholderTextColor="#999"
        />

        {/* RIGHT ICON */}
        {rightIcon && !secure && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color="#777" />
          </TouchableOpacity>
        )}

        {/* 👁️ PASSWORD ICON */}
        {secure && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={18}
              color="#777"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ERROR */}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },

  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
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
  },

  leftIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },

  rightIcon: {
    position: "absolute",
    right: 12,
  },

  error: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});
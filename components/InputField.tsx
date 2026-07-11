import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secure?: boolean;
  icon?: any;
  rightIcon?: any;
  onRightIconPress?: () => void;
  label?: string;
  error?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad" | "url";
  editable?: boolean;
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
  keyboardType = "default",
  editable = true,
}: Props) {

  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>

      {/* LABEL */}
      {label && (
        <Text style={styles.label}>
          {label.includes("*") ? (
            <>
              {label.replace("*", "")}
              <Text style={{ color: "red" }}>*</Text>
            </>
          ) : (
            label
          )}
        </Text>
      )}

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
            !editable && { backgroundColor: "#f0f0f0", color: "#888" } // styling for disabled state
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !showPassword}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
          editable={editable}
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
  
  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "500",
    color: "#333",
  },
  
});
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import PrimaryButton from "../../components/PrimaryButton";
import InputField from "../../components/InputField";

const BRAND_COLOR = "#f59e0b";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const handleReset = () => {
    // later connect backend
    console.log("Reset link sent to:", email);
  };

  return (
    <View style={styles.container}>
      
      {/* 🔙 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
      </View>

      {/* 🔒 Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed" size={40} color={BRAND_COLOR} />
      </View>

      {/* 📝 Title */}
      <Text style={styles.title}>Forgot Password?</Text>

      {/* 📄 Description */}
      <Text style={styles.description}>
        No worries! Enter the email address associated with your StrayCare
        account and we'll send you a link to reset your password.
      </Text>

      {/* 📧 Email Input */}
      <Text style={styles.label}>Email Address</Text>

      <InputField
        placeholder="example@mail.com"
        value={email}
        onChangeText={setEmail}
        icon="mail-outline"
      />

      {/* 🔘 Button */}
      <View style={{ marginTop: 20 }}>
        <PrimaryButton
          title="Send Reset Link"
          onPress={handleReset}
        />
      </View>

      {/* 🔗 Login Redirect */}
      <View style={styles.bottomTextContainer}>
        <Text style={styles.bottomText}>
          Remember your password?{" "}
          <Text
            style={styles.loginText}
            onPress={() => router.push("/auth/login")}
          >
            Log in
          </Text>
        </Text>
      </View>

      {/* 🐾 Footer Icon */}
      <View style={styles.footer}>
        <Ionicons name="paw" size={50} color="#ddd" />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  iconContainer: {
    alignSelf: "center",
    backgroundColor: "#fde7c7",
    padding: 20,
    borderRadius: 50,
    marginBottom: 20,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },

  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
  },

  bottomTextContainer: {
    marginTop: 20,
    alignItems: "center",
  },

  bottomText: {
    fontSize: 13,
    color: "#666",
  },

  loginText: {
    color: BRAND_COLOR,
    fontWeight: "600",
  },

  footer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
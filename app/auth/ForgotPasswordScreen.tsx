import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import PrimaryButton from "../../components/PrimaryButton";
import InputField from "../../components/InputField";
import { API_URL } from "../../constants/config.constants";

const BRAND_COLOR = "#f59e0b";

// Handles the two-step password recovery process:
export default function ForgotPasswordScreen() {
  const router = useRouter();

  // Stores the values entered during the password recovery process.
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: Request, 2: Reset
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // Prevents repeated submissions while an API request is in progress.
  const [loading, setLoading] = useState(false);

  // Requests a password reset code from the backend.
  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data: any = await response.json();
      if (response.ok) {
        Alert.alert(data.message);
        // Move to the second step after the reset request succeeds.
        setStep(2);
      } else {
        Alert.alert(data.message || "Request failed");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      Alert.alert("Connection error");
    } finally {
      setLoading(false);
    }
  };

  // Sends the reset code and new password to the backend.
  const handlePasswordReset = async () => {
    if (!token || !newPassword) {
      Alert.alert("Please enter both the 6-digit code and a new password");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data: any = await response.json();
      if (response.ok) {
        Alert.alert("Password reset successful! Please log in.");
        // Success! Replace the stack to ensure the user goes straight to login.
        router.replace("/auth/Login");
      } else {
        Alert.alert(data.message || "Reset failed");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* Header with navigation back to the previous screen. */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
      </View>

      {/* Changes the icon depending on the current reset step. */}
      <View style={styles.iconContainer}>
        <Ionicons name={step === 1 ? "lock-closed" : "key"} size={40} color={BRAND_COLOR} />
      </View>

      {/* Title */}
      <Text style={styles.title}>{step === 1 ? "Forgot Password?" : "Reset Password"}</Text>

      {/* Description */}
      <Text style={styles.description}>
        {step === 1
          ? "No worries! Enter the email address associated with your StrayCare account and we'll send you a 6-digit code to reset your password."
          : "Enter the 6-digit reset code sent to your email and your new password below."}
      </Text>

      {step === 1 ? (
        <>
          {/* Email Input */}
          <Text style={styles.label}>Email Address</Text>
          <InputField
            placeholder="example@mail.com"
            value={email}
            onChangeText={setEmail}
            icon="mail-outline"
          />

          {/* Request Reset Code Button */}
          <View style={{ marginTop: 20 }}>
            <PrimaryButton
              title={loading ? "Sending..." : "Send the 6-digit reset code"}
              onPress={handleRequestReset}
              disabled={loading}
            />
          </View>
        </>
      ) : (
        <>
          {/* Token Input */}
          <Text style={styles.label}>6-Digit Reset Code</Text>
          <InputField
            placeholder="123456"
            value={token}
            onChangeText={setToken}
            icon="key-outline"
            keyboardType="numeric"
          />

          {/* New Password Input */}
          <Text style={styles.label}>New Password</Text>
          <InputField
            placeholder="********"
            value={newPassword}
            onChangeText={setNewPassword}
            secure
            icon="lock-closed-outline"
          />

          {/* Reset Password Button */}
          <View style={{ marginTop: 20 }}>
            <PrimaryButton
              title={loading ? "Resetting..." : "Reset Password"}
              onPress={handlePasswordReset}
              disabled={loading}
            />
          </View>

          <View style={{ marginTop: 10 }}>
            <PrimaryButton
              title="Back to Request"
              variant="outline"
              onPress={() => setStep(1)}
            />
          </View>
        </>
      )}

      {/* Login Redirect */}
      <View style={styles.bottomTextContainer}>
        <Text style={styles.bottomText}>
          Remember your password?{" "}
          <Text
            style={styles.loginText}
            onPress={() => router.push("/auth/Login")}
          >
            Log in
          </Text>
        </Text>
      </View>

      {/* Footer Icon */}
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
    marginTop: 20,
    gap: 10,
  },

  headerTitle: {
    fontSize: 18,
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
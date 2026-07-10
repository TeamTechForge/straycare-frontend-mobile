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
import { API_URL } from "../../constants/config.constants";

const BRAND_COLOR = "#f59e0b";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: Request, 2: Reset
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message + (data.resetToken ? "\nToken (DEV ONLY): " + data.resetToken : ""));
        setStep(2);
        if (data.resetToken) setToken(data.resetToken);
      } else {
        alert(data.message || "Request failed");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      alert("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!token || !newPassword) {
      alert("Please enter both token and new password");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Password reset successful! Please log in.");
        // Success! Replace the stack to ensure the user goes straight to login.
        router.replace("/auth/Login");
      } else {
        alert(data.message || "Reset failed");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      alert("Connection error");
    } finally {
      setLoading(false);
    }
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
        <Ionicons name={step === 1 ? "lock-closed" : "key"} size={40} color={BRAND_COLOR} />
      </View>

      {/* 📝 Title */}
      <Text style={styles.title}>{step === 1 ? "Forgot Password?" : "Reset Password"}</Text>

      {/* 📄 Description */}
      <Text style={styles.description}>
        {step === 1 
          ? "No worries! Enter the email address associated with your StrayCare account and we'll send you a link to reset your password."
          : "Enter the reset token sent to your email and your new password below."}
      </Text>

      {step === 1 ? (
        <>
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
              title={loading ? "Sending..." : "Send Reset Link"}
              onPress={handleRequestReset}
              disabled={loading}
            />
          </View>
        </>
      ) : (
        <>
          {/* 🔑 Token Input */}
          <Text style={styles.label}>Reset Token</Text>
          <InputField
            placeholder="Enter token"
            value={token}
            onChangeText={setToken}
            icon="key-outline"
          />

          {/* 🔒 New Password Input */}
          <Text style={styles.label}>New Password</Text>
          <InputField
            placeholder="********"
            value={newPassword}
            onChangeText={setNewPassword}
            secure
            icon="lock-closed-outline"
          />

          {/* 🔘 Button */}
          <View style={{ marginTop: 20 }}>
            <PrimaryButton
              title={loading ? "Resetting..." : "Reset Password"}
              onPress={handlePasswordReset}
              disabled={loading}
            />
          </View>
          
          <TouchableOpacity onPress={() => setStep(1)} style={{ marginTop: 15, alignItems: 'center' }}>
            <Text style={{ color: BRAND_COLOR }}>Back to Request</Text>
          </TouchableOpacity>
        </>
      )}

      {/* 🔗 Login Redirect */}
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
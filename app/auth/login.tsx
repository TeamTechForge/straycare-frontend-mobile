import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import { API_URL } from "../../constants/Config";
import { useGoogleAuth, handleGoogleSignIn } from "../../services/googleAuthService";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginScreen() {
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google Sign-In setup
  const { response: googleResponse, promptAsync, isReady: isGoogleReady, isExpoGo } = useGoogleAuth();

  // Handle Google Sign-In response
  useEffect(() => {
    if (!googleResponse) return;

    const processGoogleSignIn = async () => {
      setIsGoogleLoading(true);
      try {
        const result = await handleGoogleSignIn(googleResponse);
        await SecureStore.setItemAsync("authToken", result.token);
        router.replace("/(tabs)/home");
      } catch (error) {
        if (error.message === "CANCELLED") {
          // User dismissed the popup — do nothing
          return;
        }
        console.error("Google Sign-In error:", error);
        Alert.alert("Google Sign-In Failed", error.message);
      } finally {
        setIsGoogleLoading(false);
      }
    };

    processGoogleSignIn();
  }, [googleResponse]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const url = `${API_URL}/auth/login`;
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ email: data.email, password: data.password });

    try {
      console.log("Attempting login via:", url);
      console.log("Login request headers:", headers);
      console.log("Login request body:", body);
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const json = await response.json();

      if (!response.ok) {
        Alert.alert("Login Failed", json.message || "Invalid credentials.");
        return;
      }

      // Store JWT securely — never in AsyncStorage
      await SecureStore.setItemAsync("authToken", json.token);

      router.replace("/(tabs)/home");
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Login error:", error);
      console.error("Login error details:", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        response: error?.response,
        request: error?.request,
      });
      if (error.name === "AbortError") {
        Alert.alert(
          "Request Timed Out",
          "The server took too long to respond. Please check your connection and try again."
        );
      } else {
        Alert.alert(
          "Connection Error",
          "Could not connect to the backend server. Please check your network connection and verify the API endpoint."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* CURVED IMAGE HEADER */}
      <View style={styles.imageContainer}>
        <Image
          source={require("../../assets/images/login-dogs.jpg")} 
          style={styles.image}
        />
        <View style={styles.curveOverlay} />
      </View>

      {/* CONTENT AREA */}
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Helping street animals, one paw at a time.
        </Text>

        {/* EMAIL INPUT */}
<Controller
  control={control}
  name="email"
  render={({ field: { onChange, value } }) => (
    <TextInput
      style={styles.input}
      placeholder="Email Address"
      value={value}
      onChangeText={onChange}
      keyboardType="email-address"
      editable={!isLoading}
    />
  )}
/>

{errors.email && (
  <Text style={{ color: "red", marginBottom: 10 }}>
    {errors.email.message}
  </Text>
)}

{/* PASSWORD INPUT */}
<Controller
  control={control}
  name="password"
  render={({ field: { onChange, value } }) => (
    <View style={styles.passwordContainer}>
      <TextInput
        style={styles.passwordInput}
        placeholder="Password"
        secureTextEntry={!isPasswordVisible}
        value={value}
        onChangeText={onChange}
        editable={!isLoading}
      />
      <TouchableOpacity
        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        style={styles.eyeIcon}
        disabled={isLoading}
      >
        <Ionicons
          name={isPasswordVisible ? "eye-off" : "eye"}
          size={20}
          color="#6B7280"
        />
      </TouchableOpacity>
    </View>
  )}
/>

{errors.password && (
  <Text style={{ color: "red", marginBottom: 10 }}>
    {errors.password.message}
  </Text>
)}

        {/*  FORGOT PASSWORD */}
        <TouchableOpacity
           style={styles.forgotContainer}
            onPress={() => router.push("/auth/forgotPasswordScreen")}
            disabled={isLoading}
        >
        <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* LOGIN BUTTON */}
        <PrimaryButton
          title={isLoading ? "Logging in..." : "Log in"}
           onPress={handleSubmit(onSubmit)}
           disabled={isLoading}
        />

        {/* DIVIDER */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* GOOGLE BUTTON (Only visible in Development Builds) */}
        {!isExpoGo && (
          <TouchableOpacity
            style={[styles.googleButton, (isLoading || isGoogleLoading || !isGoogleReady) && { opacity: 0.6 }]}
            onPress={() => promptAsync()}
            disabled={isLoading || isGoogleLoading || !isGoogleReady}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#DB4437" style={styles.googleIcon} />
            ) : (
              <AntDesign name="google" size={18} color="#DB4437" style={styles.googleIcon} />
            )}
            <Text style={styles.googleButtonText}>
              {isGoogleLoading ? "Signing in..." : "Continue with Google"}
            </Text>
          </TouchableOpacity>
        )}
        
        {/*  SIGNUP LINK */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/register")} disabled={isLoading}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const BRAND_COLOR = "#F5A623";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  imageContainer: {
    height: 220,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  curveOverlay: {
    position: "absolute",
    bottom: -30,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  forgotContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotText: {
    color: BRAND_COLOR,
    fontSize: 14,
    fontWeight: "500",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    color: "#6B7280",
    fontSize: 14,
  },
  signupLink: {
    color: BRAND_COLOR,
    fontSize: 14,
    fontWeight: "bold",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFF",
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },
});

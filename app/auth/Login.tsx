import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomAlertModal from "../../components/CustomAlertModal";
import PrimaryButton from "../../components/PrimaryButton";
import InputField from "../../components/InputField";
import AuthDivider from "../../components/auth/AuthDivider";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";
import { API_URL } from "../../constants/config.constants";
import { useAuth } from "../../contexts/AuthContext";
import { handleGoogleSignIn, useGoogleAuth } from "../../services/googleAuthService";
import { setStoredItem } from "../../utils/storage";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

// Schema for validating login form inputs
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * LoginScreen handles user authentication via email/password
 * or Google Sign-In. It also handles account suspension and warnings.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAccountNotFoundVisible, setIsAccountNotFoundVisible] = useState(false);

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
        await refreshUser();
        if (result.isNewUser) {
          router.replace("/auth/RoleSelection");
        } else {
          router.replace("/(tabs)/Home");
        }
      } catch (error: any) {
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

  // Authenticate user via backend API
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    let timeoutId: any = null;

    const url = `${API_URL}/auth/login`;
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ email: data.email, password: data.password });

    try {
      console.log("Attempting login via:", url);
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      if (controller) {
        timeoutId = setTimeout(() => controller.abort(), 20000);
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        ...(controller ? { signal: controller.signal as any } : {}),
      });

      if (timeoutId) clearTimeout(timeoutId);
      const json: any = await response.json();

      if (!response.ok) {
        console.log("[Login] Response status:", response.status);
        console.log("[Login] Response message:", json.message);
        if (response.status === 404 || json.message === "Account not found") {
          console.log("[Login] Showing account not found popup");
          setIsAccountNotFoundVisible(true);
        } else if (response.status === 403) {
          // Suspended account — block login with a clear message
          Alert.alert("Account Suspended", json.message || "Your account has been suspended.");
        } else {
          Alert.alert("Login Failed", json.message || "Invalid credentials.");
        }
        return;
      }

      // Store JWT securely (SecureStore on native, AsyncStorage on web)
      await setStoredItem("authToken", json.token);

      // Refresh AuthContext so token + user are available app-wide
      await refreshUser();

      // Warned account — let login proceed, but show the warning first
      if (json.warning) {
        Alert.alert("Account Warning", json.warning, [
          { text: "OK", onPress: () => router.replace("/(tabs)/Home") },
        ]);
      } else {
        router.replace("/(tabs)/Home");
      }
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);
      console.error("Login error:", error);
      console.error("Login error details:", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
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
      if (timeoutId) clearTimeout(timeoutId);
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
            <InputField
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
            <InputField
              placeholder="Password"
              value={value}
              onChangeText={onChange}
              secure
              editable={!isLoading}
            />
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
          onPress={() => router.push("/auth/ForgotPasswordScreen")}
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
        <AuthDivider />

        {/* GOOGLE BUTTON (Only visible in Development Builds) */}
        {!isExpoGo && (
          <GoogleSignInButton
            isLoading={isLoading || isGoogleLoading}
            isReady={isGoogleReady}
            onPress={() => promptAsync()}
          />
        )}

        {/*  SIGNUP LINK */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/Register")} disabled={isLoading}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlertModal
        visible={isAccountNotFoundVisible}
        title="Account Not Found"
        message="We couldn't find an account associated with this email. Would you like to create one?"
        confirmLabel="Create Account"
        cancelLabel="Cancel"
        onConfirm={() => {
          setIsAccountNotFoundVisible(false);
          router.push("/auth/Register");
        }}
        onCancel={() => setIsAccountNotFoundVisible(false)}
        onClose={() => setIsAccountNotFoundVisible(false)}
      />
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
});
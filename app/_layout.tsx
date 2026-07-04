// Root layout for the app, defining the navigation stack and global providers.
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SocketProvider } from "../contexts/SocketContext";
import { useFonts } from "expo-font";

function InitialLayout() {
  const { user, token, isLoading } = useAuth();
  const segments = useSegments() as any;
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const onWelcomeScreen = segments.length === 0 || segments[0] === "index";
    const onAllowedAuthScreen = segments[1] === "login" || segments[1] === "register" || segments[1] === "forgotPasswordScreen" || segments[1] === "termsPrivacyScreen" || segments[1] === "welcome";

    if (!token || !user) {
      // Force user to welcome index if they are not on welcome index or allowed auth screens
      if (!onWelcomeScreen && !onAllowedAuthScreen) {
        router.replace("/");
      }
    } else {
      // User is authenticated
      if (!user.profileCompleted) {
        const onRoleSelection = segments[1] === "roleSelection" || segments[1] === "rescuerTypeSelection";
        if (!user.roleSelected) {
          if (!onRoleSelection) {
            router.replace("/auth/roleSelection");
          }
        } else {
          if (user.role === "ngo" && segments[1] !== "ngoProfileSetup") {
            router.replace("/auth/ngoProfileSetup");
          } else if (user.role === "vet" && segments[1] !== "vetProfileSetup") {
            router.replace("/auth/vetProfileSetup");
          } else if (user.role === "volunteer" && segments[1] !== "volunteerProfileSetup") {
            router.replace("/auth/volunteerProfileSetup");
          } else if (user.role === "general_user" && segments[1] !== "reporterProfileSetup") {
            router.replace("/auth/reporterProfileSetup");
          }
        }
      } else {
        // Profile is completed
        const needsApproval = user.role === "ngo" || user.role === "vet";
        const isApproved = user.profileStatus === "Verified";

        if (needsApproval && !isApproved) {
          const onProfileSetup = segments[1] === "ngoProfileSetup" || segments[1] === "vetProfileSetup";
          const isAllowedScreen = segments[1] === "verificationPending" || 
                                  segments[1] === "verificationRejected" ||
                                  (user.profileStatus === "Rejected" && onProfileSetup);
          const isNotificationsScreen = segments[0] === "notifications";

          if (!isAllowedScreen && !isNotificationsScreen) {
            if (user.profileStatus === "Rejected") {
              router.replace("/auth/verificationRejected");
            } else {
              router.replace("/auth/verificationPending");
            }
          }
        } else {
          // User is fully approved / unrestricted
          // Redirect to home if they are sitting on guest/pending/setup routes or index
          if (inAuthGroup || onWelcomeScreen) {
            router.replace("/(tabs)/home");
          }
        }
      }
    }
  }, [user, isLoading, segments, token]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
    "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
    "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
    "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
  });

  // Wait until fonts load
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <InitialLayout />
      </SocketProvider>
    </AuthProvider>
  );
}

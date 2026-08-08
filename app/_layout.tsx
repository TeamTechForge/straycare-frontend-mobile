// Root layout for the app, defining the navigation stack and global providers.
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View, Platform, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SocketProvider } from "../contexts/SocketContext";
import { CallProvider } from "../contexts/CallContext";
import { NotificationProvider, useNotification } from "../contexts/NotificationContext";
import { useFonts } from "expo-font";
import { AlertProvider } from "../components/GlobalAlert";

function InitialLayout() {
  const { user, token, isLoading } = useAuth();
  const segments = useSegments() as any;
  const router = useRouter();
  const { addNotification } = useNotification();
  const [hasCheckedCompletion, setHasCheckedCompletion] = useState(false);
  const [shouldShowCompletion, setShouldShowCompletion] = useState(false);

  // Check if newly approved NGOs/Vets need to see the completion screen
  useEffect(() => {
    if (user && (user.role === "ngo" || user.role === "vet") && user.profileStatus === "Verified") {
      SecureStore.getItemAsync(`seenCompletion_${user._id}`).then((seen) => {
        if (!seen) {
          setShouldShowCompletion(true);
          SecureStore.setItemAsync(`seenCompletion_${user._id}`, "true");
        }
        setHasCheckedCompletion(true);
      });
    } else {
      setHasCheckedCompletion(true);
    }
  }, [user]);

  useEffect(() => {
    if (isLoading || !hasCheckedCompletion) return;

    const inAuthGroup = segments[0] === "auth";
    const onWelcomeScreen = segments.length === 0 || segments[0] === "index";
    const onAllowedAuthScreen = segments[1] === "Login" || segments[1] === "Register" || segments[1] === "ForgotPasswordScreen" || segments[1] === "TermsPrivacyScreen" || segments[1] === "Welcome";

    if (!token || !user) {
      // Force user to welcome index if they are not on welcome index or allowed auth screens
      if (!onWelcomeScreen && !onAllowedAuthScreen) {
        router.replace("/");
      }
    } else {
      // User is authenticated
      if (!user.profileCompleted) {
        const seg = segments[1]?.toLowerCase();
        const onRoleSelection = seg === "roleselection" || seg === "rescuertypeselection";
        if (!user.roleSelected) {
          if (!onRoleSelection) {
            router.replace("/auth/RoleSelection");
          }
        } else {
          if (user.role === "ngo" && segments[1] !== "NgoProfileSetup") {
            router.replace("/auth/NgoProfileSetup");
          } else if (user.role === "vet" && segments[1] !== "VetProfileSetup") {
            router.replace("/auth/VetProfileSetup");
          } else if (user.role === "volunteer" && segments[1] !== "VolunteerProfileSetup") {
            router.replace("/auth/VolunteerProfileSetup");
          } else if (user.role === "general_user" && segments[1] !== "ReporterProfileSetup") {
            router.replace("/auth/ReporterProfileSetup");
          }
        }
      } else {
        // Profile is completed
        const needsApproval = user.role === "ngo" || user.role === "vet";
        const isApproved = user.profileStatus === "Verified";

        if (needsApproval && !isApproved) {
          const onProfileSetup = segments[1] === "NgoProfileSetup" || segments[1] === "VetProfileSetup";
          const isAllowedScreen = segments[1] === "VerificationPending" ||
            segments[1] === "VerificationRejected" ||
            segments[1] === "CompletedProfileSetup" ||
            (user.profileStatus === "Rejected" && onProfileSetup);
          const isNotificationsScreen = segments[0] === "modals" && segments[1] === "Notifications";

          if (!isAllowedScreen && !isNotificationsScreen) {
            if (user.profileStatus === "Rejected") {
              router.replace("/auth/VerificationRejected");
            } else {
              router.replace("/auth/VerificationPending");
            }
          }
        } else {
          // User is fully approved / unrestricted
          // Check if they need to see the completion screen once
          if (shouldShowCompletion && segments[1] !== "CompletedProfileSetup") {
            router.replace("/auth/CompletedProfileSetup");
            return;
          }

          // Redirect to home if they are sitting on guest/pending/setup routes or index
          if (inAuthGroup || onWelcomeScreen) {
            const onCompletedProfileSetup = segments[1] === "CompletedProfileSetup";
            const onTermsPrivacyScreen = segments[1] === "TermsPrivacyScreen";
            const seg = segments[1]?.toLowerCase();
            const onSetupScreens = seg === "reporterprofilesetup" || 
                                   seg === "volunteerprofilesetup" || 
                                   seg === "ngoprofilesetup" || 
                                   seg === "vetprofilesetup";

            // If they are on a setup screen, let the component handle its own navigation
            if (!onCompletedProfileSetup && !onTermsPrivacyScreen && !onSetupScreens) {
              router.replace("/(tabs)/Home");
            }
          }
        }
      }
    }
  }, [user, isLoading, segments, token, hasCheckedCompletion, shouldShowCompletion]);

  // ─── Push Notifications Setup (Optional - only on native build) ───
  useEffect(() => {
    if (!token || !user) return;

    const setupPushNotifications = async () => {
      try {
        // Lazy load push notification service (only available on native builds)
        const { pushNotificationService } = await import("../services/pushNotificationService");

        pushNotificationService.initializePushNotifications((notification) => {
          // Handle incoming push notification
          if (notification.request.content.data) {
            const data = notification.request.content.data;
            addNotification({
              _id: `push-${Date.now()}`,
              userId: user._id || "",
              title: notification.request.content.title || "Notification",
              message: notification.request.content.body || "",
              type: (data.type as any) || "info",
              read: false,
              createdAt: new Date().toISOString(),
            });
          }
        });
      } catch (error) {
        // Push notifications not available (normal in Expo Go)
        console.log("[PUSH] Push notifications not available:", (error as any)?.message);
      }
    };

    setupPushNotifications();
  }, [token, user, addNotification]);

  // ─── Global Rescue Request Listener ───
  const seenRequestIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!token || !user) return;
    const isRescuer = user.role === "volunteer" || user.role === "ngo" || user.role === "vet" || user.role === "rescuer";
    if (!isRescuer) return;

    const checkActiveRequest = async () => {
      try {
        const { API_URL } = require("../constants/config.constants");
        const response = await fetch(`${API_URL}/rescue/active-request`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;

        const data: any = await response.json();
        const reqId = data.request?.rescueRequestId || data.request?._id;
        if (reqId && !seenRequestIdsRef.current.has(String(reqId))) {
          seenRequestIdsRef.current.add(String(reqId));

          const reporterName = data.request?.reporterName || data.request?.reporter?.name || "A reporter";
          const animalType = data.request?.animalType || "stray animal";

          // In-App Alert prompting rescuer to view complete case details first
          Alert.alert(
            "🚨 NEW RESCUE REQUEST!",
            `${reporterName} reported a ${animalType} needing rescue near your location. Review full details before accepting or rejecting.`,
            [
              {
                text: "View Case Details",
                onPress: () => router.push(`/rescue-details/${reqId}`),
              },
            ]
          );

          // Automatically push to complete rescue details screen so rescuer reviews all info first
          router.push(`/rescue-details/${reqId}`);
        }
      } catch (err) {
        console.error("Global active request check failed:", err);
      }
    };

    const interval = setInterval(checkActiveRequest, 5000);
    return () => clearInterval(interval);
  }, [token, user]);

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
        <NotificationProvider>
          <CallProvider>
            <AlertProvider>
              <InitialLayout />
            </AlertProvider>
          </CallProvider>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

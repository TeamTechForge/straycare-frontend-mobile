// Root layout for the app, defining the navigation stack and global providers.
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View, Platform } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SocketProvider } from "../contexts/SocketContext";
import { NotificationProvider, useNotification } from "../contexts/NotificationContext";
import { useFonts } from "expo-font";
import { AlertProvider } from "../components/GlobalAlert";

function InitialLayout() {
  const { user, token, isLoading } = useAuth();
  const segments = useSegments() as any;
  const router = useRouter();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (isLoading) return;

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
        const onRoleSelection = segments[1] === "RoleSelection" || segments[1] === "RescuerTypeSelection";
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
          const isNotificationsScreen = segments[0] === "Notifications";

          if (!isAllowedScreen && !isNotificationsScreen) {
            if (user.profileStatus === "Rejected") {
              router.replace("/auth/VerificationRejected");
            } else {
              router.replace("/auth/VerificationPending");
            }
          }
        } else {
          // User is fully approved / unrestricted
          // Redirect to home if they are sitting on guest/pending/setup routes or index
          if (inAuthGroup || onWelcomeScreen) {
            const onCompletedProfileSetup = segments[1] === "CompletedProfileSetup";
            if (!onCompletedProfileSetup) {
              router.replace("/(tabs)/Home");
            }
          }
        }
      }
    }
  }, [user, isLoading, segments, token]);

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
              userId: user.id || "",
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
  useEffect(() => {
    if (!token || !user) return;
    const isRescuer = user.role === "volunteer" || user.role === "ngo" || user.role === "vet";
    if (!isRescuer) return;

    let activeAlertId: string | null = null;
    let isAlertActive = false;

    const checkActiveRequest = async () => {
      if (isAlertActive) return;

      try {
        const { API_URL } = require("../constants/config.constants");
        const response = await fetch(`${API_URL}/rescue/active-request`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;

        const data: any = await response.json();
        if (data.request && data.request._id !== activeAlertId) {
          isAlertActive = true;
          activeAlertId = data.request._id;

          const respondToRequest = async (action: "accept" | "reject") => {
            try {
              const respondRes = await fetch(`${API_URL}/rescue/request/${data.request._id}/respond`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action }),
              });
              if (respondRes.ok && action === "accept") {
                router.push(`/rescue-details/${data.request._id}`);
              }
            } catch (err) {
              console.error("Error responding to request:", err);
            } finally {
              isAlertActive = false;
            }
          };

          const { Alert } = require("react-native");
          Alert.alert(
            "New Rescue Request",
            `A new case of ${data.request.animalType || "stray animal"} has been assigned to you. Do you accept?`,
            [
              {
                text: "Reject",
                onPress: () => respondToRequest("reject"),
                style: "cancel",
              },
              {
                text: "Accept",
                onPress: () => respondToRequest("accept"),
              },
            ],
            { cancelable: false }
          );
        }
      } catch (err) {
        console.error("Global active request check failed:", err);
      }
    };

    const interval = setInterval(checkActiveRequest, 4000);
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
          <AlertProvider>
            <InitialLayout />
          </AlertProvider>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

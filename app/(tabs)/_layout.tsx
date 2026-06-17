import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { API_URL } from '../../constants/Config';

const BRAND_COLOR = "#F5A623";
const TAB_BAR_BG = "#FFF7E6";


//file defines the bottom tab navigation for the StrayCare app.

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApproval = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        if (!token) {
          // Only redirect to login if we are trying to access a tabbed screen without a token
          if (segments[0] === "(tabs)") {
            router.replace("/auth/login");
          }
          return;
        }

        //send token to backend to get current user
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          console.warn("Invalid/expired token detected, purging session");
          await SecureStore.deleteItemAsync("authToken");
          if (segments[0] === "(tabs)") {
            router.replace("/auth/login");
          }
          return;
        }

        const user = await response.json();
        const isInsideTabs = segments[0] === "(tabs)";

        // 1. If profile is not completed, redirect to the appropriate setup screen
        if (isInsideTabs && !user.profileCompleted) {
          console.log(`[Auth Check] Profile incomplete for role ${user.role}. Redirecting to setup.`);
          if (user.role === "ngo") {
            router.replace("/auth/ngoProfileSetup");
          } else if (user.role === "vet") {
            router.replace("/auth/vetProfileSetup");
          } else if (user.role === "volunteer") {
            router.replace("/auth/volunteerProfileSetup");
          } else if (user.role === "general_user") {
            router.replace("/auth/reporterProfileSetup");
          } else {
            router.replace("/auth/roleSelection");
          }
          return;
        }

        // 2. To check whether ngo and vet are approved or not
        const isRestrictedRole = user.role === 'ngo' || user.role === 'vet';

        if (isRestrictedRole) {
          // Fetch profile to check verification status
          const profileRes = await fetch(`${API_URL}/profiles/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const isNotApproved = profileData.status !== 'verified';
            if (isInsideTabs && isNotApproved) {
              router.replace("/auth/verificationPending");
            }
          } else if (profileRes.status === 404) {
            // Profile not found fallback
            if (user.role === "ngo") {
              router.replace("/auth/ngoProfileSetup");
            } else if (user.role === "vet") {
              router.replace("/auth/vetProfileSetup");
            }
          }
        }
      } catch (error) {
        console.error("Approval check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkApproval();
  }, []); // Run once on mount — avoids race condition with login navigation

  if (loading) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND_COLOR,
        tabBarInactiveTintColor: '#000000ff',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 65 + insets.bottom : 70,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 18,
          paddingTop: 10,
          backgroundColor: TAB_BAR_BG,
          borderTopWidth: 1,
          borderTopColor: '#fde7c7',
          elevation: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* Community Tab */}
      <Tabs.Screen
        name="communityFeed"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* Report Tab (Center Action Tab) */}
      <Tabs.Screen
        name="report"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.centerTabContainer}>
              <View style={styles.centerTab}>
                <Ionicons name="add" size={32} color="#fff" />
              </View>
            </View>
          ),
        }}
      />

      {/*  Chat Tab */}
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} size={24} color={color} />
          ),
        }}
      />

      {/*  Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerTabContainer: {
    // Positioned slightly higher the new tab bar height
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTab: {
    backgroundColor: BRAND_COLOR,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#fff',
  },
});

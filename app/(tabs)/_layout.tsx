import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { API_URL } from '../../constants/Config';

const BRAND_COLOR = "#F5A623";
const TAB_BAR_BG = "#FFF7E6"; // Very light brand shade for a premium look

/**
 * TabLayout Component
 * This file defines the bottom tab navigation for the StrayCare app.
 * Improved UI to avoid clashing with system navigation bars on Android/iOS.
 */
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

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await response.json();

        if (response.ok) {
          // Gating logic for NGO and Vet users
          const isRestrictedRole = user.role === 'ngo' || user.role === 'vet';
          const isNotApproved = user.isApproved === false;

          // Only redirect if we are actually currently within the tabs group
          const isInsideTabs = segments[0] === "(tabs)";
          
          if (isInsideTabs && isRestrictedRole && isNotApproved) {
            // Check if user is currently on an allowed screen (Notifications is outside tabs)
            // If they are in tabs, they shouldn't be.
            router.replace("/auth/verificationPending");
          }
        }
      } catch (error) {
        console.error("Approval check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkApproval();
  }, [segments]); // Re-check on navigation within tabs

  if (loading) return null; // Or a splash/loader

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND_COLOR,
        tabBarInactiveTintColor: '#000000', // Black icons/text for normal tabs as requested
        tabBarStyle: {
          // Dynamic height based on safe area insets to avoid system bar clashing
          height: Platform.OS === 'ios' ? 65 + insets.bottom : 70, 
          // Padding bottom ensures icons sit above the home indicator or Android nav bar
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
          paddingTop: 10,
          backgroundColor: TAB_BAR_BG,
          borderTopWidth: 1,
          borderTopColor: '#fde7c7',
          elevation: 8, // Higher elevation for Android visibility
          position: 'absolute', // Ensures it stays on top of content
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
      {/* 1. Home Tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 2. Community Tab */}
      <Tabs.Screen
        name="communityFeed"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "people" : "people-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 3. Report Tab (Center Action Tab) */}
      <Tabs.Screen
        name="report"
        options={{
          title: '', // Hide label for center button
          tabBarIcon: () => (
            <View style={styles.centerTabContainer}>
              <View style={styles.centerTab}>
                <Ionicons name="add" size={32} color="#fff" />
              </View>
            </View>
          ),
        }}
      />

      {/* 4. Chat Tab */}
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* 5. Profile Tab */}
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
    // Positioned slightly higher to stand out above the new tab bar height
    top: -18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerTab: {
    backgroundColor: BRAND_COLOR,
    width: 60, // Slightly larger for better clickability
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
    borderColor: '#fff', // White border makes it stand out against the light background
  },
});

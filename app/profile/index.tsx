import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { API_URL } from "../../constants/config.constants";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EmptyStateCard from "../../components/profile/EmptyStateCard";
import PostPreviewCard from "../../components/profile/PostPreviewCard";
import ProfileHeaderCard from "../../components/profile/ProfileHeaderCard";
import ProfileMenuDrawer from "../../components/profile/ProfileMenuDrawer";
import ProfileStatsRow from "../../components/profile/ProfileStatsRow";
import ProfileTabBar from "../../components/profile/ProfileTabBar";
import ReportPreviewCard from "../../components/profile/ReportPreviewCard";
import SavedPreviewCard from "../../components/profile/SavedPreviewCard";

import GeneralUserProfile from "./GeneralUserProfile";
import VolunteerProfile from "./VolunteerProfile";
import NGOProfile from "./NgoProfile";
import VetProfile from "./VetProfile";

const BRAND_COLOR = "#F5A623";

export default function ProfileScreen() {
  const router = useRouter();

  // TODO: Replace with backend user data later
  const user = {
    name: "Elena Rodriguez",
    location: "Austin, TX",
    bio: "Animal lover and frequent volunteer. Dedicated to making the streets safer for our furry friends.",
    memberSince: "JAN 2024",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop",
  };

  // TODO: Replace with backend stats later
  const stats = [
    { value: 12, label: "REPORTS" },
    { value: 2, label: "ACTIVE" },
    { value: 15, label: "POSTS" },
    { value: "$50", label: "GIFTS" },
  ];

  // TODO: Replace with backend/API data later
  const posts = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=600&auto=format&fit=crop",
      likes: 128,
      comments: 12,
      time: "2 DAYS AGO",
    },
  ];

  const reports = [
    {
      id: 1,
      title: "Injured Dog near Central Park North",
      date: "12th June 2026",
      status: "UNDER RESCUE",
      image:
        "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=400&auto=format&fit=crop",
    },
  ];

  const savedItems = [
    {
      id: 1,
      title: "Milo - Senior Cat",
      subtitle: "Adoption",
      location: "Manhattan, NY",
      image:
        "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=400&auto=format&fit=crop",
    },
    {
      id: 2,
      title: "Central Park Meetup",
      subtitle: "Community",
      location: "450 lives",
      image:
        "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=400&auto=format&fit=crop",
    },
  ];

  const [activeTab, setActiveTab] = useState<"posts" | "reports" | "saved">("reports");
  const [menuVisible, setMenuVisible] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        if (!token) {
          router.replace("/auth/Login");
          return;
        }

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await response.json();
        
        if (response.ok) {
          setCurrentUser(user);
          
          // Check for unread notifications
          const notifRes = await fetch(`${API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const notifications: any = await notifRes.json();
          if (notifRes.ok) {
            setHasUnread(notifications.some((n: any) => !n.isRead));
          }
        }
      } catch (error) {
        console.error("Profile check error:", error);
      }
    };

    checkUser();
  }, []);

  if (!currentUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  // Render specific profile views based on role directly to keep tabs visible
  if (currentUser.role === 'general_user') {
    return <GeneralUserProfile />;
  } else if (currentUser.role === 'volunteer') {
    return <VolunteerProfile />;
  } else if (currentUser.role === 'ngo') {
    return <NGOProfile />;
  } else if (currentUser.role === 'vet') {
    return <VetProfile />;
  }

  // Fallback (should not happen with role gating)
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FAFAFA",
  },
  headerTitle: {
    fontSize: 12,
    letterSpacing: 1.2,
    color: BRAND_COLOR,
    fontWeight: "700",
  },
  sectionContent: {
    paddingTop: 14,
  },
  savedGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  notificationBtn: {
    position: "relative",
    padding: 4,
  },
  unreadBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
    borderWidth: 1,
    borderColor: "#FAFAFA",
  },
});
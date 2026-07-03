import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../constants/Config";

import EmptyStateCard from "../../components/profile/EmptyStateCard";
import PostPreviewCard from "../../components/profile/PostPreviewCard";
import ProfileHeaderCard from "../../components/profile/ProfileHeaderCard";
import ProfileMenuDrawer from "../../components/profile/ProfileMenuDrawer";
import ProfileStatsRow from "../../components/profile/ProfileStatsRow";
import ProfileTabBar from "../../components/profile/ProfileTabBar";
import ReportPreviewCard from "../../components/profile/ReportPreviewCard";
import SavedPreviewCard from "../../components/profile/SavedPreviewCard";
import { useAuth } from "../../contexts/AuthContext";

const BRAND_COLOR = "#F5A623";

export default function NGOProfile() {
  const router = useRouter();
  const { logout } = useAuth();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) return;

      const userRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      if (userRes.ok) setUser(userData);

      const profileRes = await fetch(`${API_URL}/profiles/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json();
      if (profileRes.ok) setProfile(profileData);
    } catch (error) {
      console.error("Fetch NGO profile error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const stats = [
    { value: 0, label: "RESCUES" },
    { value: 0, label: "ACTIVE" },
    { value: 0, label: "POSTS" },
    { value: "$0", label: "DONATIONS" },
  ];

  const [activeTab, setActiveTab] = useState<"posts" | "reports" | "saved">("posts");
  const [menuVisible, setMenuVisible] = useState(false);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  const userData = {
    // Show Organization Name for NGOs
    name: profile?.orgName || user?.name || "NGO",
    location: profile?.location || "Not set",
    bio: profile?.bio || "No bio yet.",
    memberSince: user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : "2026",
    avatar: profile?.profileImage || "https://via.placeholder.com/150",
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={20} color="#222" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>NGO PROFILE</Text>

        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <Ionicons name="notifications-outline" size={20} color="#222" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_COLOR} />
        }
      >
        <ProfileHeaderCard
          name={userData.name}
          location={userData.location}
          bio={userData.bio}
          memberSince={userData.memberSince}
          avatar={userData.avatar}
          role={user?.role}
          onEditPress={() => router.push("/profile/editNGOProfile")}
        />

        <ProfileStatsRow stats={stats} />

        <ProfileTabBar activeTab={activeTab} onChange={setActiveTab} />

        <View style={styles.sectionContent}>
          {activeTab === "posts" && (
            <EmptyStateCard
              icon="paw"
              title="No posts yet."
              subtitle="Share updates about your shelter and rescues."
            />
          )}

          {activeTab === "reports" && (
            <EmptyStateCard
              icon="document-text-outline"
              title="No active rescues."
              subtitle="Current rescue operations will appear here."
            />
          )}

          {activeTab === "saved" && (
            <EmptyStateCard
              icon="paw"
              title="No saved items."
              subtitle="Save important updates to view them later."
            />
          )}
        </View>
      </ScrollView>
      <ProfileMenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        user={{ 
          name: userData.name, 
          avatar: userData.avatar,
          role: user?.role,
          status: profile?.status
        }}
        onProfilePress={() => setMenuVisible(false)}
        onAdoptionPress={() => setMenuVisible(false)}
        onDonationsPress={() => {
          setMenuVisible(false);
          router.push("/donate");
        }}
        onSettingsPress={() => {
          setMenuVisible(false);
          router.push("/profile/settings");
        }}
        onLogoutPress={async () => {
          setMenuVisible(false);
          await logout();
          router.replace("/");
        }}
      />
    </SafeAreaView>
  );
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
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
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
});

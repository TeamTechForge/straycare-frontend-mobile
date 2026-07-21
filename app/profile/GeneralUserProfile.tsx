import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../constants/config.constants";

import EmptyStateCard from "../../components/profile/EmptyStateCard";
import PostPreviewCard from "../../components/profile/PostPreviewCard";
import ProfileHeaderCard from "../../components/profile/ProfileHeaderCard";
import ProfileMenuDrawer from "../../components/profile/ProfileMenuDrawer";
import ProfileStatsRow from "../../components/profile/ProfileStatsRow";
import ProfileTabBar, { TabKey } from "../../components/profile/ProfileTabBar";
import ReportPreviewCard from "../../components/profile/ReportPreviewCard";
import { useAuth } from "../../contexts/AuthContext";
import SavedPreviewCard from "../../components/profile/SavedPreviewCard";

const BRAND_COLOR = "#F5A623";

interface Post {
  id: string;
  image: string;
  likes: number;
  comments: number;
  time: string;
}

interface Report {
  id: string;
  title: string;
  date: string;
  status: string;
  image: string;
}

interface SavedItem {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  image: string;
}

export default function GeneralUserProfile() {
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

      // Fetch User details
      const userRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = (await userRes.json()) as any;
      if (userRes.ok) setUser(userData);

      // Fetch Profile details
      const profileRes = await fetch(`${API_URL}/profiles/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = (await profileRes.json()) as any;
      if (profileRes.ok) setProfile(profileData);

      const userId = userData._id || userData.id;
      if (userId) {
        // Fetch Reports
        const reportsRes = await fetch(`${API_URL}/users/${userId}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reportsRes.ok) {
          const reportsData = (await reportsRes.json()) as any;
          setReports(reportsData);
        }

        // Fetch Posts
        const postsRes = await fetch(`${API_URL}/users/${userId}/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (postsRes.ok) {
          const postsData = (await postsRes.json()) as any;
          setPosts(postsData);
        }
      }

    } catch (error) {
      console.error("Fetch profile data error:", error);
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

  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);

  const stats = [
    { value: reports.length, label: "REPORTS" },
    { value: posts.length, label: "POSTS" },
  ];

  const [activeTab, setActiveTab] = useState<TabKey>("reports");
  const [menuVisible, setMenuVisible] = useState(false);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  const userData = {
    name: user?.name || "User",
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

        <Text style={styles.headerTitle}>MY PROFILE</Text>

        <TouchableOpacity onPress={() => router.push("/modals/Notifications" as any)}>
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
          onEditPress={() => router.push("/profile/EditProfile")}
        />

        <ProfileStatsRow stats={stats} />

        <ProfileTabBar activeTab={activeTab} onChange={setActiveTab} />


        <View style={styles.sectionContent}>
          {activeTab === "posts" && (
            posts.length > 0 ? (
              posts.map((post) => (
                <PostPreviewCard
                  key={post.id}
                  image={post.image}
                  likes={post.likes}
                  comments={post.comments}
                  time={post.time}
                  onPress={() => router.push({ pathname: "/community-feed/CommunityPostView", params: { id: post.id || (post as any)._id } })}
                />
              ))
            ) : (

              <EmptyStateCard
                icon="paw"
                title="You haven't posted anything yet."
                subtitle="Create posts and share them with the community."
              />
            )
          )}

          {activeTab === "reports" && (
            reports.length > 0 ? (
              <View>
                {/* 📌 CURRENT CASES */}
                <Text style={styles.subSectionTitle}>Current Cases</Text>
                {reports.filter((r: any) => ["Needs Help", "Pending", "Request Sent", "Under Rescue"].includes(r.status)).length > 0 ? (
                  reports.filter((r: any) => ["Needs Help", "Pending", "Request Sent", "Under Rescue"].includes(r.status)).map((report: any) => (
                    <ReportPreviewCard
                      key={report._id || report.caseId}
                      title={`${report.animalType} (${report.caseId})`}
                      date={new Date(report.createdAt).toLocaleDateString()}
                      status={report.status}
                      image={report.photos && report.photos.length > 0 ? report.photos[0] : "https://via.placeholder.com/150"}
                      caseId={report.caseId}
                      summary={report.summary}
                      onPress={() => {
                        router.push({
                          pathname: "/reporting/CaseDetails",
                          params: { caseId: report.caseId },
                        });
                      }}
                      onTrackPress={() => {
                        router.push({
                          pathname: "/request-status",
                          params: { caseId: report.caseId },
                        });
                      }}
                    />
                  ))
                ) : (
                  <Text style={styles.noActiveText}>No active rescue cases right now.</Text>
                )}

                {/* 📜 RESCUE HISTORY */}
                <Text style={[styles.subSectionTitle, { marginTop: 16 }]}>Rescue History</Text>
                {reports.filter((r: any) => !["Needs Help", "Pending", "Request Sent", "Under Rescue"].includes(r.status)).length > 0 ? (
                  reports.filter((r: any) => !["Needs Help", "Pending", "Request Sent", "Under Rescue"].includes(r.status)).map((report: any) => (
                    <ReportPreviewCard
                      key={report._id || report.caseId}
                      title={`${report.animalType} (${report.caseId})`}
                      date={new Date(report.createdAt).toLocaleDateString()}
                      status={report.status}
                      image={report.photos && report.photos.length > 0 ? report.photos[0] : "https://via.placeholder.com/150"}
                      caseId={report.caseId}
                      summary={report.summary}
                      onPress={() => {
                        router.push({
                          pathname: "/reporting/CaseDetails",
                          params: { caseId: report.caseId },
                        });
                      }}
                    />
                  ))
                ) : (
                  <Text style={styles.noActiveText}>No completed rescue history yet.</Text>
                )}
              </View>
            ) : (
              <EmptyStateCard
                icon="document-text-outline"
                title="You haven't reported anything yet."
                subtitle="Rescue street animals by reporting and view the rescue progress."
              />
            )
          )}

          {activeTab === "saved" && (
            savedItems.length > 0 ? (
              <View style={styles.savedGrid}>
                {savedItems.map((item) => (
                  <SavedPreviewCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    location={item.location}
                    image={item.image}
                    onPress={() => router.push({ pathname: "/community-feed/CommunityPostView", params: { id: item.id || (item as any)._id } })}
                  />
                ))}
              </View>
            ) : (
              <EmptyStateCard
                icon="paw"
                title="You haven't saved anything yet."
                subtitle="Save adoption posts or community updates to view them later."
              />
            )
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
        onAdoptionPress={() => {
          setMenuVisible(false);
        }}
        onDonationsPress={() => {
          setMenuVisible(false);
          router.push("/donate/History");
        }}
        onSettingsPress={() => {
          setMenuVisible(false);
          router.push("/profile/Settings");
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
  subSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  noActiveText: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 12,
  },
  savedGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

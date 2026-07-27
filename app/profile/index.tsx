import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../constants/config.constants";

import EmptyStateCard from "../../components/profile/EmptyStateCard";
import PostPreviewCard from "../../components/profile/PostPreviewCard";
import ProfileHeaderCard from "../../components/profile/ProfileHeaderCard";
import ProfileMenuDrawer from "../../components/profile/ProfileMenuDrawer";
import ProfileStatsRow from "../../components/profile/ProfileStatsRow";
import ProfileTabBar, { TabKey } from "../../components/profile/ProfileTabBar";
import ReportPreviewCard from "../../components/profile/ReportPreviewCard";
import SavedPreviewCard from "../../components/profile/SavedPreviewCard";
import { useAuth } from "../../contexts/AuthContext";

const BRAND_COLOR = "#F5A623";

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [rescues, setRescues] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // Status update modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [updateText, setUpdateText] = useState("");

  const fetchData = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        router.replace("/auth/Login");
        return;
      }

      const userRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = (await userRes.json()) as any;
      if (userRes.ok) setUser(userData);

      const profileRes = await fetch(`${API_URL}/profiles/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = (await profileRes.json()) as any;
      if (profileRes.ok) {
        setProfile(profileData);
        // If role supports donations
        if (userData?.role === 'ngo' || userData?.role === 'vet') {
          if (profileData && profileData._id) {
            const donationRes = await fetch(`${API_URL}/donations/total/${profileData._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (donationRes.ok) {
              const donationData: any = await donationRes.json();
              setTotalDonations(donationData.total || 0);
            }
          }
        }
      }

      const userId = userData._id || userData.id;
      if (userId) {
        // Fetch rescues for roles that need them
        if (userData?.role !== 'general_user') {
          const rescuesRes = await fetch(`${API_URL}/rescues/my-rescues?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (rescuesRes.ok) {
            const rescuesData = (await rescuesRes.json()) as any;
            setRescues(rescuesData);
          }
        }

        const reportsRes = await fetch(`${API_URL}/users/${userId}/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reportsRes.ok) {
          const reportsData = (await reportsRes.json()) as any;
          setReports(reportsData);
        }

        const postsRes = await fetch(`${API_URL}/users/${userId}/posts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (postsRes.ok) {
          const postsData = (await postsRes.json()) as any;
          setPosts(postsData);
        }
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
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

  const handleUpdateDetails = (caseId: string) => {
    setSelectedCaseId(caseId);
    setUpdateText("");
    setModalVisible(true);
  };

  const submitDetailsUpdate = async () => {
    if (!updateText.trim() || !selectedCaseId) return;
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const response = await fetch(`${API_URL}/rescue/request/${selectedCaseId}/details`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ summary: updateText.trim() }),
      });
      if (response.ok) {
        Alert.alert("Success", "Rescue details updated successfully!");
        setModalVisible(false);
        fetchData(); // Reload rescues
      } else {
        const errData = (await response.json()) as any;
        Alert.alert("Error", errData.error || "Failed to update details.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Something went wrong.");
    }
  };

  // Role-based logic
  const isGeneralUser = user?.role === 'general_user';
  const isVolunteer = user?.role === 'volunteer';
  const isNgo = user?.role === 'ngo';
  const isVet = user?.role === 'vet';

  const stats = [
    { value: posts.length, label: "POSTS" },
    ...(!isGeneralUser ? [{ value: rescues.length, label: "RESCUES" }] : []),
    { value: reports.length, label: "REPORTS" },
    ...(isNgo || isVet ? [{ value: "$" + totalDonations, label: "DONATIONS" }] : []),
  ];

  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const [menuVisible, setMenuVisible] = useState(false);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  // Dynamic header and profile info based on role
  let headerTitle = "MY PROFILE";
  let defaultName = "User";
  let location = profile?.location || "Not set";
  let bio = profile?.bio || "No bio yet.";

  if (isVolunteer) {
    headerTitle = "VOLUNTEER PROFILE";
    defaultName = "Volunteer";
  } else if (isNgo) {
    headerTitle = "NGO PROFILE";
    defaultName = "NGO";
    if (profile?.orgName) defaultName = profile.orgName;
  } else if (isVet) {
    headerTitle = "VET PROFILE";
    defaultName = "Veterinarian";
    location = profile?.clinicAddress || profile?.primaryLocation || location;
    bio = profile?.bio || `License: ${profile?.licenseNumber || 'N/A'}\nClinic: ${profile?.clinicName || 'N/A'}`;
  }

  const userData = {
    name: user?.name && isNgo && profile?.orgName ? profile.orgName : (user?.name || defaultName),
    location: location,
    bio: bio,
    memberSince: user?.createdAt ? new Date(user.createdAt).getFullYear().toString() : "2026",
    avatar: profile?.profileImage || "https://via.placeholder.com/150",
  };
  
  // To handle saved items (all current files had it empty)
  const savedItems: any[] = [];

  const tabOptions = isGeneralUser ? ["posts", "reports", "saved"] : ["posts", "rescues", "reports", "saved"];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={20} color="#222" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{headerTitle}</Text>

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

        <ProfileTabBar activeTab={activeTab} onChange={setActiveTab} tabs={tabOptions as any} />

        <View style={styles.sectionContent}>
          {activeTab === "posts" && (
            posts.length > 0 ? (
              posts.map((post: any) => (
                <PostPreviewCard
                  key={post.id || post._id}
                  image={post.image}
                  likes={post.likes}
                  comments={post.comments}
                  time={post.time}
                  onPress={() => router.push({ pathname: "/community-feed/CommunityPostView", params: { id: post.id || post._id } })}
                />
              ))
            ) : (
              <EmptyStateCard
                icon="paw"
                title={isVet ? "No posts yet." : "You haven't posted anything yet."}
                subtitle={isVet ? "Share your medical cases and animal care tips." : "Create posts and share them with the community."}
              />
            )
          )}

          {activeTab === "rescues" && !isGeneralUser && (
            rescues.length > 0 ? (
              rescues.map((rescue: any) => (
                <ReportPreviewCard
                  key={rescue.id || rescue.caseId}
                  title={`${rescue.animalType} (${rescue.caseId})`}
                  date={new Date(rescue.createdAt).toLocaleDateString()}
                  status={rescue.status}
                  image={rescue.photos && rescue.photos.length > 0 ? rescue.photos[0] : "https://via.placeholder.com/150"}
                  summary={rescue.summary}
                  actionText="Update Status"
                  onActionPress={() => handleUpdateDetails(rescue.caseId)}
                  onPress={() => router.push({ pathname: "/rescue-details/[id]", params: { id: rescue.caseId || rescue._id } })}
                />
              ))
            ) : (
              <EmptyStateCard
                icon="medkit-outline"
                title="No active cases yet."
                subtitle={isVolunteer ? "Your accepted rescue requests will appear here." : "Current treatments and medical cases will appear here."}
              />
            )
          )}

          {activeTab === "reports" && (
            reports.length > 0 ? (
              reports.map((report: any) => (
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
                      pathname: "/live-tracking/[requestId]",
                      params: { requestId: report.caseId || report._id },
                    });
                  }}
                  onTrackPress={() => {
                    router.push({
                      pathname: "/live-tracking/[requestId]",
                      params: { requestId: report.caseId },
                    });
                  }}
                />
              ))
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
                icon="bookmark-outline"
                title={isGeneralUser ? "You haven't saved anything yet." : "No saved items yet."}
                subtitle="Save interesting posts or rescue histories to view them later."
              />
            )
          )}
        </View>
      </ScrollView>

      {/* Cross-platform modal for updating status details */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Update Rescue Status</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., On my way to the location, Animal is safe"
              value={updateText}
              onChangeText={setUpdateText}
              multiline
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.submitBtn]} onPress={submitDetailsUpdate}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ProfileMenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        user={{
          name: userData.name,
          avatar: userData.avatar,
          role: user?.role,
          status: profile?.status
        }}
        onAdoptionPress={() => setMenuVisible(false)}
        onProfilePress={() => setMenuVisible(false)}
        onDonationsPress={() => {
          setMenuVisible(false);
          router.push(isNgo || isVet ? "/donate/DonationHub" : "/donate/History");
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
  savedGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#EFEFEF",
    borderRadius: 10,
    padding: 12,
    height: 80,
    textAlignVertical: "top",
    marginBottom: 16,
    fontSize: 13,
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
  },
  submitBtn: {
    backgroundColor: BRAND_COLOR,
  },
  cancelBtnText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 13,
  },
  submitBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },
});
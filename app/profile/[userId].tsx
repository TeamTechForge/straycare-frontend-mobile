import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
  Clipboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_URL } from "../../constants/config.constants";
import { useAuth } from "../../contexts/AuthContext";
import { useChatApi } from "../../hooks/useChatApi";
import { useCall } from "../../contexts/CallContext";
import PrimaryButton from "../../components/PrimaryButton";
import EmptyStateCard from "../../components/profile/EmptyStateCard";
import PostPreviewCard from "../../components/profile/PostPreviewCard";
import ReportPreviewCard from "../../components/profile/ReportPreviewCard";
import DropdownMenu from "../../components/profile/DropdownMenu";
import ReportUserModal from "../../components/profile/ReportUserModal";
import ProfileStatsRow from "../../components/profile/ProfileStatsRow";

const BRAND_COLOR = "#F5A623";

interface Post {
  _id: string;
  title: string;
  tag: string;
  author: string;
  likes: number;
  commentCount: number;
  createdAt: string;
}

interface Report {
  _id: string;
  caseId: string;
  animalType: string;
  breed?: string;
  status: string;
  notes?: string;
  location?: { address?: string };
  photos?: string[];
  createdAt: string;
  summary?: string;
}

interface Rescue {
  _id: string;
  status: string;
  animalDetails?: { type?: string; breed?: string; notes?: string };
  location?: { address?: string };
  createdAt: string;
  summary?: string;
}

export default function PublicProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { user } = useAuth();
  const { createConversation } = useChatApi();
  const { startCall } = useCall();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Profile Data
  const [userData, setUserData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>({});
  const [permissions, setPermissions] = useState<any>(null);

  // Tab Data
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [rescues, setRescues] = useState<Rescue[]>([]);

  // UI States
  const [activeTab, setActiveTab] = useState<string>("posts");
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const fetchProfileAndStats = async () => {
    try {
      if (!userId || typeof userId !== "string" || !/^[0-9a-fA-F]{24}$/.test(userId)) {
        console.warn(`Invalid userId passed to profile route: ${userId}`);
        setLoading(false);
        return;
      }

      const token = await SecureStore.getItemAsync("authToken");

      // 1. Fetch public profile and stats
      const response = await fetch(`${API_URL}/users/${userId}/public-profile`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn("Profile fetch failed:", response.status, errorText);
        throw new Error(`Failed to fetch profile: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as any;
      setUserData(data.user);
      setProfileData(data.profile);
      setStatsData(data.stats);
      setPermissions(data.permissions);

      // Set initial tab based on role
      if (data.user.role === "general_user") {
        setActiveTab("reports");
      } else {
        setActiveTab("posts");
      }

      // 2. Fetch posts
      const postsRes = await fetch(`${API_URL}/users/${userId}/posts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (postsRes.ok) {
        const postsData = (await postsRes.json()) as any;
        setPosts(postsData);
      }

      // 3. Fetch reports (if general user)
      if (data.user.role === "general_user") {
        const reportsRes = await fetch(`${API_URL}/users/${userId}/reports`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (reportsRes.ok) {
          const reportsData = (await reportsRes.json()) as any;
          setReports(reportsData);
        }
      }

      // 4. Fetch rescues (if volunteer/vet/ngo)
      if (data.user.role !== "general_user") {
        const rescuesRes = await fetch(`${API_URL}/rescues/my-rescues?userId=${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (rescuesRes.ok) {
          const rescuesData = (await rescuesRes.json()) as any;
          setRescues(rescuesData);
        }
      }

    } catch (error: any) {
      console.warn("Error fetching public profile:", error);
      Alert.alert("Error", "Could not load user profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProfileAndStats();
    }
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileAndStats();
  };

  const handleMessage = async () => {
    if (!user) {
      Alert.alert("Authentication required", "Please log in to message this user.");
      return;
    }

    if (user._id === userId) {
      Alert.alert("Error", "You cannot message yourself.");
      return;
    }

    setLoading(true);
    try {
      const conversation = (await createConversation(userId as string, "direct")) as any;
      const otherParticipant = conversation.participants?.find(
        (p: any) => p._id !== user._id
      );

      router.push({
        pathname: "/chat/[conversationId]",
        params: {
          conversationId: conversation._id,
          recipientName: otherParticipant?.name || userData?.name || "Chat",
          recipientId: userId as string,
          recipientImage: otherParticipant?.profileImage || profileData?.profileImage || "",
        },
      });
    } catch (error: any) {
      console.error("Failed to start/open conversation:", error);
      Alert.alert(
        "Could Not Start Chat",
        error.message || "Something went wrong while starting the conversation."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (!user) {
      Alert.alert("Authentication required", "Please log in to call this user.");
      return;
    }

    if (user._id === userId) {
      Alert.alert("Error", "You cannot call yourself.");
      return;
    }

    startCall(userId as string, userData?.name || "User", profileData?.profileImage || "");
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://straycare.org/profile/${userId}`;
      await Share.share({
        message: `Check out ${userData?.name}'s profile on StrayCare: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `https://straycare.org/profile/${userId}`;
    Clipboard.setString(shareUrl);
    Alert.alert("Link Copied", "Profile link copied to clipboard.");
  };

  const handleBlockUser = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        Alert.alert("Authentication required", "Please log in to block this user.");
        return;
      }

      const response = await fetch(`${API_URL}/users/${userId}/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      });

      const resData: any = await response.json();

      if (response.ok) {
        Alert.alert("Success", resData.message);
        setMenuVisible(false);
      } else {
        Alert.alert("Error", resData.message || "Failed to block user.");
      }
    } catch (error: any) {
      console.error("Block user error:", error);
      Alert.alert("Error", "Something went wrong. Please check your connection.");
    }
  };

  const handleReportSubmit = async (reason: string, description: string): Promise<boolean> => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        Alert.alert("Authentication required", "Please log in to submit a report.");
        return false;
      }

      const response = await fetch(`${API_URL}/reports/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportedUserId: userId,
          reason,
          description,
        }),
      });

      const resData = (await response.json()) as any;
      if (response.ok) {
        Alert.alert("Success", "User has been reported. Our admin team will review this shortly.");
        return true;
      } else {
        Alert.alert("Error", resData.message || "Failed to submit report.");
        return false;
      }
    } catch (error) {
      console.error("Report submit error:", error);
      Alert.alert("Error", "Something went wrong. Please check your connection.");
      return false;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>User not found</Text>
      </View>
    );
  }

  // Determine user role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "general_user":
        return "General User";
      case "volunteer":
        return "Volunteer";
      case "vet":
        return "Veterinarian";
      case "ngo":
        return "NGO / Shelter";
      default:
        return "Member";
    }
  };



  // Determine available tabs
  const getTabs = () => {
    if (userData.role === "general_user") {
      return [{ id: "reports", label: "Reports" }, { id: "posts", label: "Posts" }];
    } else {
      return [{ id: "posts", label: "Posts" }, { id: "rescues", label: "Rescues" }];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>PROFILE</Text>

        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_COLOR} />
        }
      >
        {/* Profile Details Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profileData?.profileImage || "https://via.placeholder.com/150" }}
              style={styles.avatar}
            />
          </View>

          <View style={styles.roleBadgeContainer}>
            <View style={[styles.roleBadge, { backgroundColor: userData.role === 'general_user' ? '#9CA3AF' : BRAND_COLOR }]}>
              <Text style={styles.roleBadgeText}>{getRoleLabel(userData.role)}</Text>
            </View>
            {userData.isApproved && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{userData.name}</Text>

          {profileData?.location ? (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.location}>{profileData.location}</Text>
            </View>
          ) : null}

          {/* Role specific info */}
          {userData.role === "volunteer" && profileData?.serviceArea ? (
            <Text style={styles.metaInfo}>Service Area: {profileData.serviceArea}</Text>
          ) : null}
          {userData.role === "vet" && profileData?.clinicName ? (
            <View style={{ alignItems: "center" }}>
              <Text style={styles.metaInfo}>Clinic: {profileData.clinicName}</Text>
              <Text style={styles.metaInfo}>Specialization: {profileData.specialization || "General"}</Text>
            </View>
          ) : null}
          {userData.role === "ngo" && profileData?.orgName ? (
            <Text style={styles.metaInfo}>Org: {profileData.orgName}</Text>
          ) : null}

          <Text style={styles.bio}>{profileData?.bio || "No bio available."}</Text>

          <Text style={styles.joinDate}>
            MEMBER SINCE {userData.createdAt ? new Date(userData.createdAt).getFullYear() : "2026"}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.msgButton, permissions?.canMessage === false && styles.disabledButton]}
              onPress={handleMessage}
              disabled={permissions?.canMessage === false}
            >
              {permissions?.canMessage === false ? (
                <Feather name="lock" size={16} color="#FFF" style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.msgButtonText}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.callButton, permissions?.canCall === false && styles.disabledButton]}
              onPress={handleCall}
              disabled={permissions?.canCall === false}
            >
              {permissions?.canCall === false ? (
                <Feather name="lock" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="call-outline" size={18} color="#9CA3AF" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        <ProfileStatsRow stats={
          userData.role === "general_user"
            ? [
              { value: statsData.reportsCount || 0, label: "REPORTS" },
              { value: statsData.postsCount || 0, label: "POSTS" },
            ]
            : [
              { value: statsData.postsCount || 0, label: "POSTS" },
              { value: statsData.rescuesCompleted || 0, label: "RESCUES" },
            ]
        } />

        {/* Tabs Bar */}
        <View style={styles.tabContainer}>
          {getTabs().map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.activeTabLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContentContainer}>
          {activeTab === "posts" && (
            posts.length > 0 ? (
              posts.map((post) => (
                <PostPreviewCard
                  key={post._id}
                  image="https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=600&auto=format&fit=crop" // Fallback placeholder image for posts
                  likes={post.likes}
                  comments={post.commentCount}
                  time={new Date(post.createdAt).toLocaleDateString()}
                  onPress={() => router.push({ pathname: "/community-feed/CommunityPostView", params: { id: post._id } })}
                />
              ))
            ) : (
              <EmptyStateCard
                icon="paw"
                title="No posts yet"
                subtitle="This user hasn't published any community posts."
              />
            )
          )}

          {activeTab === "reports" && (
            reports.length > 0 ? (
              reports.map((report) => (
                <ReportPreviewCard
                  key={report._id}
                  title={`${report.animalType} (${report.breed || "Mixed"})`}
                  date={new Date(report.createdAt).toLocaleDateString()}
                  status={report.status}
                  image={report.photos && report.photos.length > 0 ? report.photos[0] : "https://via.placeholder.com/150"}
                  summary={report.summary}
                  onPress={() => {
                    router.push({
                      pathname: "/live-tracking/[requestId]",
                      params: { requestId: report.caseId || report._id },
                    });
                  }}
                />
              ))
            ) : (
              <EmptyStateCard
                icon="document-text-outline"
                title="No reports yet"
                subtitle="This user hasn't submitted any reports."
              />
            )
          )}

          {activeTab === "rescues" && (
            rescues.length > 0 ? (
              rescues.map((rescue: any) => (
                <ReportPreviewCard
                  key={rescue._id || rescue.caseId}
                  title={`${rescue.animalType} (${rescue.caseId})`}
                  date={new Date(rescue.createdAt).toLocaleDateString()}
                  status={rescue.status.toUpperCase()}
                  image={rescue.photos && rescue.photos.length > 0 ? rescue.photos[0] : "https://via.placeholder.com/150"}
                  summary={rescue.summary}
                  onPress={() => {
                    router.push({
                      pathname: "/live-tracking/[requestId]",
                      params: { requestId: rescue.caseId || rescue._id },
                    });
                  }}
                />
              ))
            ) : (
              <EmptyStateCard
                icon="checkmark-done-circle-outline"
                title="No rescues yet"
                subtitle="This user hasn't participated in any rescue operations."
              />
            )
          )}
        </View>
      </ScrollView>

      {/* Action Dropdown Menu */}
      <DropdownMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        options={[
          {
            label: "Share Profile",
            icon: "share-social-outline",
            onPress: handleShare,
          },
          {
            label: "Copy Profile Link",
            icon: "copy-outline",
            onPress: handleCopyLink,
          },
          {
            label: "Report User",
            icon: "alert-circle-outline",
            onPress: () => setReportModalVisible(true),
            destructive: true,
          },
          {
            label: "Block/Unblock User",
            icon: "ban-outline",
            onPress: handleBlockUser,
            destructive: true,
          },
        ]}
      />

      {/* Report User Form Sheet */}
      <ReportUserModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmit={handleReportSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: BRAND_COLOR,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 4,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: BRAND_COLOR,
    padding: 3,
    backgroundColor: "#FFF4E6",
    marginBottom: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 42,
  },
  roleBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#065F46",
    marginLeft: 3,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 3,
  },
  location: {
    fontSize: 13,
    color: "#6B7280",
  },
  metaInfo: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  joinDate: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND_COLOR,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  msgButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    maxWidth: 160,
  },
  msgButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    maxWidth: 160,
    opacity: 0.6,
  },
  callButtonText: {
    color: "#55575bff",
    fontSize: 14,
    fontWeight: "600",
  },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomColor: BRAND_COLOR,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  activeTabLabel: {
    color: BRAND_COLOR,
  },
  tabContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});

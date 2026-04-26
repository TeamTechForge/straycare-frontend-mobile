import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import EmptyStateCard from "../../components/profile/EmptyStateCard";
import PostPreviewCard from "../../components/profile/PostPreviewCard";
import ProfileHeaderCard from "../../components/profile/ProfileHeaderCard";
import ProfileMenuDrawer from "../../components/profile/ProfileMenuDrawer";
import ProfileStatsRow from "../../components/profile/ProfileStatsRow";
import ProfileTabBar from "../../components/profile/ProfileTabBar";
import ReportPreviewCard from "../../components/profile/ReportPreviewCard";
import SavedPreviewCard from "../../components/profile/SavedPreviewCard";

const BRAND_COLOR = "#F5A623";

export default function GeneralUserProfile() {
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

  const [activeTab, setActiveTab] = useState<"posts" | "reports" | "saved">("posts");
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={20} color="#222" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>MY PROFILE</Text>

        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={20} color="#222" />
        </TouchableOpacity>
      </View>





      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
  <ProfileHeaderCard
    name={user.name}
    location={user.location}
    bio={user.bio}
    memberSince={user.memberSince}
    avatar={user.avatar}
    onEditPress={() => {}}
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
              reports.map((report) => (
                <ReportPreviewCard
                  key={report.id}
                  title={report.title}
                  date={report.date}
                  status={report.status}
                  image={report.image}
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
        user={{ name: user.name, avatar: user.avatar }}
        onProfilePress={() => setMenuVisible(false)}
        onAdoptionPress={() => {
          setMenuVisible(false);
        }}
        onDonationsPress={() => {
          setMenuVisible(false);
          router.push("/donate");
        }}
        onSettingsPress={() => {
          setMenuVisible(false);
          router.push("/profile/settings");
        }}
        onLogoutPress={() => {
          setMenuVisible(false);
          // TODO: add logout logic later
        }} 
      /> 
    </View>
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
    paddingTop: 18,
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
});
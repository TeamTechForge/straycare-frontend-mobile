import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getCommunityPost } from "../../api/apiService";

// Converts ISO date string to readable format like "MAR 15, 2024"
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).toUpperCase();
}

export default function CommunityPostView() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>(); // Get post ID from navigation params

  const [post, setPost] = useState<any>(null);   // Stores the fetched post data
  const [loading, setLoading] = useState(true);  // True while API request is in progress
  const [error, setError] = useState(false);     // True if API request fails

  // Fetch post when screen loads or when ID changes
  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  // Calls the API to fetch a single post by ID and updates state accordingly
  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await getCommunityPost(id);
      if (response.data.success) {
        setPost(response.data.data); // Store post data on success
      } else {
        setError(true); // API returned failure response
      }
    } catch (err) {
      setError(true); // Network or unexpected error
    } finally {
      setLoading(false); // Always stop spinner regardless of outcome
    }
  };

  return (
    <View style={styles.container}>

      {/* Header — back button on left, title in center, empty view on right for balance */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/community-feed/CommunityPostMain")}
        >
          <Ionicons name="arrow-back" size={24} color="#161c27" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Feed</Text>
        <View style={styles.iconBtn} /> {/* Empty view keeps title centered */}
      </View>

      {/* Show spinner while post data is being fetched */}
      {loading && (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#775a00" />
          <Text style={styles.stateText}>Loading post...</Text>
        </View>
      )}

      {/* Show error message with retry button if fetch failed */}
      {!loading && error && (
        <View style={styles.centeredState}>
          <Ionicons name="cloud-offline-outline" size={40} color="#837565" />
          <Text style={styles.stateText}>Failed to load post.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPost}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Render full post content only when loaded successfully */}
      {!loading && !error && post && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main post card */}
          <View style={styles.card}>

            {/* Hero image — only renders if post has an imageUrl */}
            {post.imageUrl ? (
              <Image
                source={{ uri: `http://10.87.129.94:5000${post.imageUrl}` }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.cardBody}>

              {/* Date on the left, category badge on the right */}
              <View style={styles.metaRow}>
                <Text style={styles.dateText}>{formatDate(post.submittedAt)}</Text>
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{post.category}</Text>
                </View>
              </View>

              {/* Post title */}
              <Text style={styles.headline}>{post.title}</Text>

              {/* Author name with "Posted by" prefix, separated by divider lines */}
              <View style={styles.authorRow}>
                <Text style={styles.authorText}>
                  Posted by{" "}
                  <Text style={styles.authorName}>{post.authorName}</Text>
                </Text>
              </View>

              {/* Full post content body */}
              <Text style={styles.description}>{post.content}</Text>
            </View>
          </View>

          {/* Action buttons below the post card */}
          <View style={styles.actionsContainer}>

            {/* Back button — returns to the community feed list */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.push("/community-feed/CommunityPostMain")}
            >
              <Ionicons name="chevron-back" size={20} color="#704900" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>

            {/* Report button — navigates to the report screen with post ID */}
            <TouchableOpacity
              style={styles.reportBtn}
              onPress={() =>
                router.push({
                  pathname: "/community-feed/ReportCommunityPost",
                  params: { id: post._id },
                })
              }
            >
              <MaterialIcons name="report" size={20} color="#E54D4D" />
              <Text style={styles.reportBtnText}>Report Post</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Root screen container
  container: {
    flex: 1,
    backgroundColor: "#f9f9ff",
  },

  // Fixed top header with back button and screen title
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50, // Offset for device status bar
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  // Circular tap target for header icons
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#161c27",
  },

  // Centered layout for loading, error, and empty states
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  stateText: {
    fontSize: 14,
    color: "#837565",
    fontWeight: "500",
  },
  // Gold pill retry button
  retryBtn: {
    backgroundColor: "#fcd371",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#775a00",
  },

  // Scroll area padding with extra bottom space
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },

  // White rounded card clipping the hero image to match border radius
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F1F1F1",
  },
  // Hero image spans full card width at fixed height
  heroImage: {
    width: "100%",
    height: 220,
  },
  // Inner card content area with vertical spacing between sections
  cardBody: {
    padding: 20,
    gap: 12,
  },

  // Row holding date (left) and category badge (right)
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Uppercase spaced date label in muted color
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "#837565",
    textTransform: "uppercase",
  },
  // Green pill badge for the post category
  tagBadge: {
    backgroundColor: "#E6F7ED",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#27C468",
  },

  // Large bold post title
  headline: {
    fontSize: 22,
    fontWeight: "800",
    color: "#161c27",
    lineHeight: 28,
    letterSpacing: -0.4,
  },

  // Author row separated from title and content by top and bottom borders
  authorRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F1F1",
  },
  authorText: {
    fontSize: 15,
    color: "#504537",
  },
  // Bold dark styling for the author name inline within authorText
  authorName: {
    fontWeight: "700",
    color: "#161c27",
  },

  // Full post body text with comfortable line height
  description: {
    fontSize: 15,
    color: "#504537",
    lineHeight: 24,
  },

  // Vertical stack of action buttons below the card
  actionsContainer: {
    gap: 12,
  },
  // Gold pill back button with icon and label side by side
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#f9b959",
    borderRadius: 999,
    paddingVertical: 16,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#704900",
  },
  // Light red pill report button with icon and label side by side
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFF1F1",
    borderRadius: 999,
    paddingVertical: 16,
  },
  reportBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E54D4D",
  },
});
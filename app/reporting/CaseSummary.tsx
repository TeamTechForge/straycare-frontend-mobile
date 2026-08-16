import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import { Ionicons, Feather } from "@expo/vector-icons";
import BackButton from "../../components/BackButton";

import { API_URL } from "../../constants/config.constants";
import { colors } from "../../constants/colors.constants";
import { spacing } from "../../constants/spacing.constants";
import { typography } from "../../constants/typography.constants";
import { useAuth } from "../../contexts/AuthContext";
import { getStoredItem } from "../../utils/storage";
import ImageViewer from "../../components/ui/ImageViewer";

const DEFAULT_PHOTO =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop&q=80";

const resolvePhotoUrl = (url: string | undefined): string => {
  if (!url) return DEFAULT_PHOTO;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${cleanUrl}`;
};

export default function CaseSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const caseId = Array.isArray(params.caseId) ? params.caseId[0] : params.caseId;
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const fetchCaseSummary = useCallback(async () => {
    if (!caseId) {
      setError("Invalid Case ID");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const authToken = token || (await getStoredItem("authToken"));
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      // 1. Fetch from Stray Reports
      try {
        const res = await axios.get(`${API_URL}/strays/report/${caseId}`, { headers });
        if (res.data) {
          setCaseData(res.data);
          return;
        }
      } catch (_err) {
        // Fallback to rescue status endpoint if not found in stray reports
      }

      // 2. Fallback: Fetch from Rescue status
      try {
        const rescueRes = await axios.get(`${API_URL}/rescue/status/${caseId}`, { headers });
        if (rescueRes.data) {
          setCaseData(rescueRes.data);
          return;
        }
      } catch (_rescueErr) {
        // Fallback to rescues endpoint
      }

      // 3. Fallback: Fetch from rescues
      const altRes = await axios.get(`${API_URL}/rescues/${caseId}`, { headers });
      setCaseData(altRes.data);
    } catch (err: any) {
      console.warn("[CaseSummary] Error loading summary:", err?.message || err);
      setError(err?.response?.data?.message || "Failed to load case summary.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [caseId, token]);

  useEffect(() => {
    fetchCaseSummary();
  }, [fetchCaseSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCaseSummary();
  };

  const getStatusTheme = (statusStr?: string) => {
    const s = (statusStr || "").toLowerCase();
    if (s.includes("need") || s.includes("help") || s.includes("urgent")) {
      return { bg: "#FFEBEE", text: "#C62828", border: "#FFCDD2", label: "Needs Help" };
    }
    if (s.includes("under rescue") || s.includes("in progress") || s.includes("pending") || s.includes("accepted")) {
      return { bg: "#FFF7E6", text: "#B8860B", border: "#FFE8B3", label: statusStr || "Under Rescue" };
    }
    if (s.includes("treat")) {
      return { bg: "#E8F5E9", text: "#2E7D32", border: "#C8E6C9", label: "Treated" };
    }
    if (s.includes("adopt")) {
      return { bg: "#E3F2FD", text: "#1565C0", border: "#BBDEFB", label: "Ready for Adoption" };
    }
    if (s.includes("complet")) {
      return { bg: "#E8F5E9", text: "#1B5E20", border: "#C8E6C9", label: "Completed" };
    }
    return { bg: "#F3F4F6", text: "#4B5563", border: "#E5E7EB", label: statusStr || "Reported" };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Loading case summary...</Text>
      </SafeAreaView>
    );
  }

  if (error || !caseData) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>{error || "Case not found."}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const animalType = caseData.animalType || caseData.animalDetails?.type || "Stray Animal";
  const breed = caseData.breed || caseData.animalDetails?.breed || "";
  const category = caseData.category || caseData.reportCategory || "Rescue Case";
  const statusTheme = getStatusTheme(caseData.status);
  const displayCaseId = caseData.caseId || caseData.rescueRequestId || caseId;
  const descriptionText =
    caseData.summary || caseData.notes || caseData.description || caseData.animalDetails?.notes || "No additional description provided.";

  const formattedDate = caseData.createdAt
    ? new Date(caseData.createdAt).toLocaleDateString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recently reported";

  const locationAddress =
    caseData.location?.address ||
    (caseData.location?.lat ? "Location pinned on map" : "General area recorded");

  const photos: string[] = Array.isArray(caseData.photos) && caseData.photos.length > 0
    ? caseData.photos
    : caseData.photoUrl
    ? [caseData.photoUrl]
    : [];

  const timeline: any[] = Array.isArray(caseData.timeline) ? caseData.timeline : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Case Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5A623" />
        }
      >
        {/* ── Status & Case ID Banner ── */}
        <View style={styles.bannerCard}>
          <View>
            <Text style={styles.caseIdLabel}>CASE ID</Text>
            <Text style={styles.caseIdText}>{displayCaseId}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusTheme.bg, borderColor: statusTheme.border },
            ]}
          >
            <Text style={[styles.statusText, { color: statusTheme.text }]}>
              {statusTheme.label}
            </Text>
          </View>
        </View>

        {/* ── Photos Carousel / Main Image ── */}
        {photos.length > 0 ? (
          <View style={styles.photoSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosScroll}
            >
              {photos.map((photoUri, index) => {
                const fullUrl = resolvePhotoUrl(photoUri);
                return (
                  <TouchableOpacity
                    key={`${photoUri}-${index}`}
                    activeOpacity={0.9}
                    style={styles.photoWrapper}
                    onPress={() => setSelectedPhoto(fullUrl)}
                  >
                    <Image source={{ uri: fullUrl }} style={styles.photoImage} resizeMode="cover" />
                    <View style={styles.zoomBadge}>
                      <Ionicons name="scan-outline" size={14} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* ── Quick Overview Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Case Overview</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>ANIMAL TYPE</Text>
              <Text style={styles.infoValue}>
                {animalType}
                {breed ? ` (${breed})` : ""}
              </Text>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>REPORTED ON</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>CATEGORY</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{category}</Text>
              </View>
            </View>

            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>GENERAL AREA</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                <Text style={styles.locationText} numberOfLines={2}>
                  {locationAddress}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Summary & Notes Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Case Summary</Text>
          <Text style={styles.bodyDescription}>{descriptionText}</Text>
        </View>

        {/* ── Public Timeline / Milestones ── */}
        {timeline.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Progress Milestones</Text>
            <View style={styles.timelineContainer}>
              {timeline.map((item, idx) => {
                const isLast = idx === timeline.length - 1;
                const timeText = item.timestamp
                  ? new Date(item.timestamp).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <View key={`timeline-${idx}`} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineDot,
                          isLast && { backgroundColor: "#10B981" },
                        ]}
                      />
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineRight}>
                      <Text style={styles.timelineStatus}>{item.status || "Update"}</Text>
                      {item.message ? (
                        <Text style={styles.timelineMessage}>{item.message}</Text>
                      ) : null}
                      {timeText ? (
                        <Text style={styles.timelineTime}>{timeText}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ── Privacy Notice Banner ── */}
        <View style={styles.privacyCard}>
          <Feather name="shield" size={16} color="#4B5563" style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={styles.privacyText}>
            Public Case Summary · Private contact information and internal dispatch details are protected.
          </Text>
        </View>
      </ScrollView>

      {/* ── Image Viewer Modal ── */}
      <ImageViewer
        imageUrl={selectedPhoto}
        visible={Boolean(selectedPhoto)}
        onClose={() => setSelectedPhoto(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: typography.medium,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 15,
    fontFamily: typography.semibold,
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#F5A623",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: typography.bold,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: typography.bold,
    color: "#111827",
  },
  scrollContent: {
    padding: spacing.md,
    gap: 14,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  caseIdLabel: {
    fontSize: 11,
    fontFamily: typography.bold,
    color: "#9CA3AF",
    letterSpacing: 0.6,
  },
  caseIdText: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: "#1F2937",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontFamily: typography.bold,
  },
  photoSection: {
    marginHorizontal: -spacing.md,
  },
  photosScroll: {
    paddingHorizontal: spacing.md,
    gap: 12,
  },
  photoWrapper: {
    width: 220,
    height: 150,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  zoomBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 5,
    borderRadius: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: "#111827",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: typography.semibold,
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: "#1F2937",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF1CC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F5A623",
  },
  categoryBadgeText: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: "#D97706",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: "#374151",
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  bodyDescription: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: "#374151",
    lineHeight: 22,
  },
  timelineContainer: {
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: "row",
    minHeight: 44,
  },
  timelineLeft: {
    width: 20,
    alignItems: "center",
    marginRight: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F5A623",
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 2,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineStatus: {
    fontSize: 13,
    fontFamily: typography.bold,
    color: "#111827",
  },
  timelineMessage: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: "#4B5563",
    marginTop: 2,
  },
  timelineTime: {
    fontSize: 11,
    fontFamily: typography.regular,
    color: "#9CA3AF",
    marginTop: 2,
  },
  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    fontFamily: typography.regular,
    color: "#6B7280",
    lineHeight: 18,
  },
});

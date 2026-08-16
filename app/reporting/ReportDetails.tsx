import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import MapViewWrapper, { Marker } from "../../components/MapViewWrapper";
import { API_URL } from "../../constants/config.constants";
import { useAuth } from "../../contexts/AuthContext";
import { getStoredItem } from "../../utils/storage";

const colors = {
  primary: "#FEB94B",
  white: "#FFFFFF",
  background: "#FFFFFF",
  card: "#F6E3BF",
  border: "#E0B35A",
  text: "#111111",
  error: "#FF3B30",
};

const typography = {
  regular: "Inter-Regular",
  medium: "Inter-Medium",
  semibold: "Inter-SemiBold",
  bold: "Inter-Bold",
  title: 22,
  section: 18,
  body: 14,
  small: 12,
};

const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=400&h=300&fit=crop&q=80";

const resolvePhotoUrl = (url: string | undefined): string => {
  if (!url) return DEFAULT_PHOTO;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${cleanUrl}`;
};

export default function ReportDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const caseId = Array.isArray(params.caseId) ? params.caseId[0] : params.caseId;
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const fetchReportDetails = async () => {
      if (!caseId) {
        setError("Invalid Case ID");
        setLoading(false);
        return;
      }

      try {
        console.log("[ReportDetails] Fetching details for caseId:", caseId);
        const authToken = token || (await getStoredItem("authToken"));
        const res = await axios.get(`${API_URL}/strays/report/${caseId}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        setReport(res.data);
      } catch (err: any) {
        console.error("[ReportDetails] Error loading report:", err);
        setError(err?.response?.data?.message || "Failed to load report details.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [caseId, token]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading rescue details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !report) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || "Report not found."}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const animalType = report.animalType || "Not specified";
  const breed = report.breed || "Not specified";
  const category = report.category || report.reportCategory || "General Report";
  const status = report.status || "Under Rescue";
  const caseIdText = report.caseId || caseId;
  const descriptionText = report.notes || report.description || "No initial notes provided.";
  const summaryText = report.summary || "Rescuer is actively managing the rescue.";

  const reportedDateTime = report.createdAt
    ? new Date(report.createdAt).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "Not available";

  const locationLat = report.location?.lat || report.location?.latitude;
  const locationLng = report.location?.lng || report.location?.longitude;
  const locationAddress = report.location?.address || "Location specified on map";
  const photos: string[] = Array.isArray(report.photos) ? report.photos : [];
  const timeline: any[] = Array.isArray(report.timeline) ? report.timeline : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rescue Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STATUS BANNER */}
        <View style={styles.statusBanner}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
          </View>
          <Text style={styles.caseIdBadge}>Case ID: {caseIdText}</Text>
        </View>

        {/* ANIMAL & REPORT SUMMARY CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Animal & Report Overview</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Animal Type</Text>
            <Text style={styles.detailValue}>{animalType}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Breed</Text>
            <Text style={styles.detailValue}>{breed}</Text>
          </View>



          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reported Date & Time</Text>
            <Text style={styles.detailValue}>{reportedDateTime}</Text>
          </View>
        </View>

        {/* RESCUE PROGRESS & NOTES CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rescue Progress & Notes</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Latest Rescue Progress Note</Text>
            <Text style={styles.bodyText}>{summaryText}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Original Report Notes</Text>
            <Text style={styles.bodyText}>{descriptionText}</Text>
          </View>
        </View>

        {/* LOCATION & MAP CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rescue Location</Text>
          <Text style={styles.addressText}>📍 {locationAddress}</Text>

          {locationLat != null && locationLng != null && (
            <View style={styles.mapContainer}>
              <MapViewWrapper
                provider="google"
                style={styles.map}
                initialRegion={{
                  latitude: locationLat,
                  longitude: locationLng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{ latitude: locationLat, longitude: locationLng }}
                  title={animalType}
                  description={locationAddress}
                />
              </MapViewWrapper>
            </View>
          )}
        </View>

        {/* RESCUE TIMELINE HISTORY */}
        {timeline.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Rescue Timeline Progress</Text>
            <View style={styles.timelineList}>
              {timeline.map((step: any, idx: number) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStatus}>{step.status || "Status Updated"}</Text>
                    {step.message ? <Text style={styles.timelineMessage}>{step.message}</Text> : null}
                    {step.timestamp ? (
                      <Text style={styles.timelineTime}>
                        {new Date(step.timestamp).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* PHOTOS SECTION */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Attached Photos ({photos.length})</Text>
          {photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
              {photos.map((uri: string, index: number) => {
                const photoUrl = resolvePhotoUrl(uri);
                return (
                  <View key={index} style={styles.photoWrapper}>
                    <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.noPhotosText}>No photos attached to this report.</Text>
          )}
        </View>
      </ScrollView>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: typography.medium,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 15,
    fontFamily: typography.medium,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backIcon: {
    fontSize: 20,
    color: "#111827",
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: "#111827",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  statusBanner: {
    backgroundColor: "#FFF1CC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F5A623",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    backgroundColor: "#F5A623",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: "#FFFFFF",
  },
  caseIdBadge: {
    fontSize: 13,
    fontFamily: typography.bold,
    color: "#D97706",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: "#111827",
    marginBottom: 12,
  },
  detailRow: {
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: typography.medium,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: "#1F2937",
  },
  bodyText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: "#374151",
    lineHeight: 20,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF1CC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F5A623",
  },
  categoryBadgeText: {
    fontSize: 13,
    fontFamily: typography.bold,
    color: "#D97706",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
  addressText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: "#374151",
    marginBottom: 10,
  },
  mapContainer: {
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  map: {
    flex: 1,
  },
  timelineList: {
    marginTop: 4,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F5A623",
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: "#111827",
  },
  timelineMessage: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: "#4B5563",
    marginTop: 2,
  },
  timelineTime: {
    fontSize: 11,
    fontFamily: typography.medium,
    color: "#9CA3AF",
    marginTop: 2,
  },
  photosScroll: {
    flexDirection: "row",
  },
  photoWrapper: {
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  photo: {
    width: 180,
    height: 140,
    borderRadius: 12,
  },
  noPhotosText: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});

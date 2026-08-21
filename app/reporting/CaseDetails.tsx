import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getReportByCaseId, updateCaseStatus } from "../../api/strayApiService";
import BackButton from "../../components/BackButton";
import MapViewWrapper, { Marker } from "../../components/MapViewWrapper";
import PrimaryButton from "../../components/PrimaryButton";
import { API_URL } from "../../constants/config.constants";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Interface defining the structure of a stray animal report payload.
 */
type Report = {
  caseId: string;
  animalType: string;
  breed?: string;
  category: string;
  status: string;
  notes?: string;
  anonymous?: boolean;
  reportedBy?: string;
  isOwner?: boolean;
  permissions?: { canAccept: boolean; canUpdate: boolean; canDelete?: boolean; isSelfReported?: boolean };
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  photos?: string[];
  timeline?: {
    status: string;
    timestamp: string;
    message?: string;
    actorName?: string;
    rescuerName?: string;
  }[];
};

/**
 * Returns the theme color associated with a given case status.
 *
 * @param status - Current status string of the report
 * @returns Hex color string for status badge/timeline dots
 */
const getStatusColor = (status: string) => {
  switch (status) {
    case "Needs Help":
      return "#D32F2F";
    case "Under Rescue":
      return "#FBC02D";
    case "Treated":
      return "#2E7D32";
    case "Ready for Adoption":
      return "#1976D2";
    default:
      return "gray";
  }
};

/**
 * Resolves the appropriate text color for status badges based on background contrast.
 *
 * @param status - Current status string of the report
 * @returns Hex color string for badge text
 */
const getStatusTextColor = (status: string) =>
  status === "Under Rescue" ? "#2B2B2B" : "#FFFFFF";

/**
 * Determines the next valid status progression.
 *
 * @param current - Current status string
 * @returns Next status string or null if terminal status
 */
const getNextStatus = (current: string) => {
  switch (current) {
    case "Needs Help":
      return "Under Rescue";
    case "Under Rescue":
      return "Treated";
    case "Treated":
      return "Ready for Adoption";
    default:
      return null;
  }
};

/**
 * Case Details Screen Component.
 *
 * Displays full details, timeline, photo gallery, location map, and rescuer management controls
 * for a specific stray care report.
 */
export default function CaseDetailsScreen() {
  const { caseId, focus, source } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // Navigation source tracking (whether screen was opened from Profile or Map)
  const openedFromProfile = source === "profile";
  const returnToPreviousScreen = () =>
    router.replace(openedFromProfile ? "/profile" : "/(tabs)/Report");

  // Case Data & UI State
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [acceptingRescue, setAcceptingRescue] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [statusUpdateY, setStatusUpdateY] = useState<number | null>(null);

  // Notification Banner States
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // Role Checks (Rescuer vs Reporter permissions)
  const isRescuer = user && ["volunteer", "ngo", "vet", "rescuer"].includes(user.role);
  const isReporter = user && !isRescuer;

  /**
   * Fetches latest case details by case ID from backend API.
   */
  const loadCase = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await getReportByCaseId(caseId as string);
      setReport(data);
    } catch (err: any) {
      console.log("Error loading case:", err);
      setLoadError(err?.message || "Failed to load case details.");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCase();
    setRefreshing(false);
  }, [loadCase]);

  // Reload case data on screen focus
  useFocusEffect(
    useCallback(() => {
      void loadCase();
    }, [loadCase])
  );

  // Auto-scroll to status update section if focused via deep link parameter
  useEffect(() => {
    if (focus !== "status-update" || loading || statusUpdateY === null) return;
    const frame = requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, statusUpdateY - 20), animated: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [focus, loading, statusUpdateY]);

  /**
   * Handles status progression (e.g. Needs Help -> Under Rescue -> Treated -> Ready for Adoption).
   */
  const handleStatusUpdate = async () => {
    if (!report) return;

    // Check rescuer permissions
    if (!isRescuer || !report.permissions?.canUpdate) {
      Alert.alert(
        "Access Denied",
        report.permissions?.canAccept
          ? "Accept this case first before changing the status."
          : "Only the assigned rescuer can change the status of this case."
      );
      return;
    }

    const next = getNextStatus(report.status);
    if (!next) return;

    setUpdating(true);
    try {
      await updateCaseStatus(report.caseId, next);
      await loadCase();

      // Redirect to adoption post creation if case reaches Ready for Adoption
      if (next === "Ready for Adoption") {
        Alert.alert(
          "Ready for Adoption",
          "Case marked as Ready for Adoption! Would you like to create an adoption listing now?",
          [
            { text: "Later", style: "cancel" },
            {
              text: "Create Listing",
              onPress: () => {
                router.push({
                  pathname: "/adoption-corner/CreateAdoptionPost",
                  params: { caseId: report.caseId },
                } as never);
              },
            },
          ]
        );
      } else {
        //  Show banner immediately when status changes
        setNotificationMessage(`Case updated: ${next}`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }

      // Show notification banner on successful update
      setNotificationMessage(`Case updated: ${next}`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (err: any) {
      console.log("Failed to update status:", err);

      // Handle 403 Forbidden error
      if (err?.status === 403 || err?.response?.status === 403) {
        Alert.alert(
          "Not Allowed",
          "Only the assigned rescuer can change the status of this case."
        );
      } else {
        Alert.alert("Error", "Failed to update case status. Please try again.");
      }
    } finally {
      setUpdating(false);
    }
  };

  // Render loading indicator
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading case details...</Text>
      </View>
    );
  }

  // Render error message or missing report state
  if (loadError || !report) {
    return (
      <View style={styles.center}>
        <Text style={styles.value}>{loadError || "Case not found."}</Text>
        <PrimaryButton
          title={openedFromProfile ? "Back to Profile" : "Back to Map"}
          onPress={returnToPreviousScreen}
        />
      </View>
    );
  }

  const statusColor = getStatusColor(report.status);
  const nextStatus = getNextStatus(report.status);

  /**
   * Prompts rescuer to accept and take ownership of the rescue case.
   */
  const acceptRescue = async () => {
    Alert.alert(
      "Accept this case?",
      "This will assign the case to you and change the status to Under Rescue.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            setAcceptingRescue(true);
            try {
              const token = await SecureStore.getItemAsync("authToken");
              const response = await axios.post(
                `${API_URL}/strays/report/${report.caseId}/accept`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const data = response.data as any;
              await loadCase();
              router.push({
                pathname: "/rescuer-response/[requestId]",
                params: { requestId: data.requestId, caseId: report.caseId },
              } as never);
            } catch (err: any) {
              const errorMsg =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.message ||
                "Failed to accept rescue. Please try again.";
              Alert.alert("Accept Failed", errorMsg);
            } finally {
              setAcceptingRescue(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >

      {/* Notification Banner */}
      {showNotification && (
        <View style={styles.notificationBanner}>
          <Text style={styles.notificationText}>{notificationMessage}</Text>
        </View>
      )}

      {/* Navigation Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, justifyContent: "center" }}>
        <View style={{ position: "absolute", left: 0, zIndex: 1 }}>
          <BackButton onPress={() => router.back()} />
        </View>
        <Text style={[styles.caseId, { marginBottom: 0, textAlign: "center" }]}>Case ID: {report.caseId}</Text>
      </View>

      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={[styles.statusText, { color: getStatusTextColor(report.status) }]}>
          {report.status}
        </Text>
      </View>

      {/* Photos Carousel */}
      <Text style={styles.label}>Photos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        {report.photos && report.photos.length > 0 ? (
          report.photos.map((uri: string, index: number) => (
            <Image key={index} source={{ uri }} style={styles.photo} />
          ))
        ) : (
          <Text style={styles.value}>No photos available</Text>
        )}
      </ScrollView>

      {/* Animal & Location Details Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.label}>Animal Type</Text>
        <Text style={styles.value}>{report.animalType}</Text>

        <Text style={styles.label}>Breed</Text>
        <Text style={styles.value}>{report.breed || "Unknown"}</Text>

        <Text style={styles.label}>Category</Text>
        <Text style={styles.value}>{report.category}</Text>

        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{report.location?.address || "Unknown"}</Text>
      </View>

      {/* Reporter Information Card */}
      <View style={[styles.sectionCard, report.anonymous ? styles.anonymousCard : styles.reporterCard]}>
        <Text style={styles.label}>Reported By</Text>
        <Text style={styles.reporterName}>{report.reportedBy || "Reporter"}</Text>
        {report.anonymous ? (
          <Text style={styles.anonymousHint}>Identity hidden for privacy</Text>
        ) : null}
      </View>

      {/* Incident Location Map View */}
      {report.location?.lat != null && report.location?.lng != null && (
        <MapViewWrapper
          provider="google"
          style={styles.map}
          initialRegion={{
            latitude: report.location.lat,
            longitude: report.location.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: report.location.lat,
              longitude: report.location.lng,
            }}
          />
        </MapViewWrapper>
      )}

      {/* Condition Notes Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>{report.notes || "No additional notes"}</Text>
      </View>

      {/* Rescuer Status Progression Button */}
      <View onLayout={(event) => setStatusUpdateY(event.nativeEvent.layout.y)}>
        {nextStatus && report.permissions?.canUpdate && (
          <PrimaryButton
            title={updating ? "Updating..." : `Mark as "${nextStatus}"`}
            onPress={handleStatusUpdate}
            disabled={updating}
          />
        )}
      </View>

      {/* Accept Rescue Case Button */}
      {isRescuer && report.permissions?.canAccept && (
        <PrimaryButton
          title={acceptingRescue ? "Accepting..." : "Accept This Case"}
          onPress={acceptRescue}
          disabled={acceptingRescue}
        />
      )}

      {/* Restricted Access Information Notice */}
      {nextStatus && !report.permissions?.canUpdate && (!report.permissions?.canAccept || report.isOwner) && (
        <View style={styles.restrictedMessage}>
          <Text style={styles.restrictedText}>
            {report.permissions?.isSelfReported && isRescuer && report.status === "Needs Help"
              ? "You reported this case. Rescuers cannot accept cases reported by themselves. Another rescuer will handle this case."
              : isReporter || report.isOwner
              ? "You can track this case here. Only the assigned rescuer can update the rescue status."
              : "Only the assigned rescuer can change the status of this case."}
          </Text>
        </View>
      )}

      {/* Timeline History */}
      <Text style={styles.label}>Rescue Timeline :</Text>

      {report.timeline && report.timeline.length > 0 ? (
        report.timeline.map((entry, index) => (
          <View key={index} style={styles.timelineItem}>
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: getStatusColor(entry.status) },
              ]}
            />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineStatus}>{entry.status}</Text>

              {/* Timeline message */}
              <Text style={styles.timelineMessage}>
                {entry.status === "Needs Help" && entry.message === "Case created"
                  ? `Case reported by ${report.anonymous ? "Anonymous" : report.reportedBy || "Reporter"}`
                  : entry.message}
              </Text>

              {/* Rescuer information tag */}
              {entry.actorName && (
                <View style={styles.rescuerInfoBox}>
                  <Text style={styles.rescuerInfoLabel}>
                    👤 {entry.rescuerName}
                  </Text>
                </View>
              )}

              <Text style={styles.timelineTime}>
                {new Date(entry.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.value}>No timeline updates yet</Text>
      )}

      {/* Screen Navigation Action Button */}
      <PrimaryButton
        title={openedFromProfile ? "Back to Profile" : "Back to Map"}
        onPress={returnToPreviousScreen}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fafafa" },
  notificationBanner: {
    backgroundColor: "#FFB700",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  notificationText: {
    color: "black",
    fontWeight: "600",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  caseId: { fontSize: 24, fontWeight: "900", marginBottom: 12, textAlign: "center" },
  statusBadge: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 20,
  },
  statusText: { color: "white", fontWeight: "700" },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#ddd",
  },
  map: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ccc",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineStatus: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  timelineMessage: {
    fontSize: 14,
    color: "#444",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    marginTop: 4,
    color: "#222",
  },
  reporterCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#F5A623",
    backgroundColor: "#fffbf0",
  },
  anonymousCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#999",
    backgroundColor: "#f5f5f5",
  },
  anonymousHint: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  reporterName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  restrictedMessage: {
    backgroundColor: "#e3f2fd",
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
    padding: 14,
    borderRadius: 8,
    marginVertical: 16,
  },
  restrictedText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1565c0",
    textAlign: "center",
  },
  rescuerInfoBox: {
    backgroundColor: "#f5f5f5",
    borderLeftWidth: 3,
    borderLeftColor: "#F5A623",
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  rescuerInfoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
});

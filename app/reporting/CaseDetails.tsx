import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import MapViewWrapper, { Marker } from "../../components/MapViewWrapper";
import { getReportByCaseId, updateCaseStatus } from "../../api/strayApiService";
import PrimaryButton from "../../components/PrimaryButton";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL } from "../../constants/config.constants";
import axios from "axios";

type Report = {
  caseId: string;
  animalType: string;
  breed?: string;
  category: string;
  status: string;
  notes?: string;
  anonymous?: boolean;
  reportedBy?: string;
  permissions?: { canAccept: boolean; canUpdate: boolean };
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

const getStatusTextColor = (status: string) =>
  status === "Under Rescue" ? "#2B2B2B" : "#FFFFFF";

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

export default function CaseDetailsScreen() {
  const { caseId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [acceptingRescue, setAcceptingRescue] = useState(false);

  // 🔔 Notification States
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  // 🔒 Check if user is a rescuer
  const isRescuer = user && ["volunteer", "ngo", "vet", "rescuer"].includes(user.role);
  const isReporter = user && !isRescuer;

  // 📡 Real-time updates via Socket.io
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

  useFocusEffect(
    useCallback(() => {
      void loadCase();
    }, [loadCase])
  );

  const handleStatusUpdate = async () => {
    if (!report) return;

    // 🔒 Check if user is a rescuer
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

      // 🔔 Show banner immediately when status changes
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading case details...</Text>
      </View>
    );
  }

  if (loadError || !report) {
    return (
      <View style={styles.center}>
        <Text style={styles.value}>{loadError || "Case not found."}</Text>
        <PrimaryButton title="Back to Map" onPress={() => router.back()} />
      </View>
    );
  }

  const statusColor = getStatusColor(report.status);
  const nextStatus = getNextStatus(report.status);
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>

      {/* 🔔 Notification Banner */}
      {showNotification && (
        <View style={styles.notificationBanner}>
          <Text style={styles.notificationText}>{notificationMessage}</Text>
        </View>
      )}

      <Text style={styles.caseId}>Case ID: {report.caseId}</Text>

      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={[styles.statusText, { color: getStatusTextColor(report.status) }]}>
          {report.status}
        </Text>
      </View>

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

      {/* Case Details */}
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

      <View style={[styles.sectionCard, report.anonymous ? styles.anonymousCard : styles.reporterCard]}>
        <Text style={styles.label}>Reported By</Text>
        <Text style={styles.reporterName}>{report.reportedBy || "Reporter"}</Text>
        {report.anonymous ? (
          <Text style={styles.anonymousHint}>Identity hidden for privacy</Text>
        ) : null}
      </View>

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

      {/* Notes */}
      <View style={styles.sectionCard}>
        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>{report.notes || "No additional notes"}</Text>
      </View>

      {/* ✅ Status Update Button - Rescuers Only */}
      {nextStatus && report.permissions?.canUpdate && (
        <PrimaryButton
          title={updating ? "Updating..." : `Mark as "${nextStatus}"`}
          onPress={handleStatusUpdate}
          disabled={updating}
        />
      )}

      {/* Accept Rescue Button - Rescuers Only, only when case Needs Help */}
      {report.permissions?.canAccept && (
        <PrimaryButton
          title={acceptingRescue ? "Accepting..." : "Accept This Case"}
          onPress={acceptRescue}
          disabled={acceptingRescue}
        />
      )}

      {/* 🔒 Info Message for Non-Rescuers */}
      {nextStatus && !report.permissions?.canUpdate && !report.permissions?.canAccept && (
        <View style={styles.restrictedMessage}>
          <Text style={styles.restrictedText}>
            {isReporter
              ? "You can track this case here. Only the assigned rescuer can update the rescue status."
              : "Only the assigned rescuer can change the status of this case."}
          </Text>
        </View>
      )}

      <Text style={styles.label}>Rescue Timeline :</Text>

      {report.timeline && report.timeline.length > 0 ? (
        report.timeline.map((entry: any, index: number) => (
          <View key={index} style={styles.timelineItem}>
            <View
              style={[
                styles.timelineDot,
                { backgroundColor: getStatusColor(entry.status) },
              ]}
            />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineStatus}>{entry.status}</Text>

              {/* Show message with rescuer info if available */}
              <Text style={styles.timelineMessage}>
                {entry.status === "Needs Help" && entry.message === "Case created"
                  ? `Case reported by ${report.anonymous ? "Anonymous" : report.reportedBy || "Reporter"}`
                  : entry.message}
              </Text>

              {/* Show rescuer details card if available */}
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

      {/* ✅ Fix applied here: Pops the screen instead of pushing a new map */}
      <PrimaryButton title="Back to Map" onPress={() => router.back()} />
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
  anonymousBadge: {
    fontSize: 16,
    fontWeight: "700",
    color: "#666",
    marginBottom: 8,
  },
  anonymousHint: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  reporterAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#ddd",
  },
  reporterName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  reporterRole: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F5A623",
    marginTop: 4,
  },
  reporterContact: {
    fontSize: 13,
    color: "#555",
    marginTop: 3,
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

  rescuerInfoRole: {
    fontSize: 12,
    color: "#F5A623",
    fontWeight: "500",
    marginTop: 4,
  },
});

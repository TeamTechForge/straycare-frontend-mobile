import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getReportByCaseId, updateCaseStatus } from "../../api/strayApiService";
import PrimaryButton from "../../components/PrimaryButton";
import { API_URL } from "../../constants/config.constants";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

/**
 * Interface defining the structure of a stray animal report payload on web.
 */
type Report = {
  caseId: string;
  animalType: string;
  breed?: string;
  category: string;
  status: string;
  notes?: string;
  permissions?: { canAccept: boolean; canUpdate: boolean };
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
};

/**
 * Determines the next valid status progression in the rescue workflow lifecycle.
 *
 * @param status - Current status string of the report
 * @returns Next status string or null if terminal status
 */
const getNextStatus = (status: string) => {
  if (status === "Under Rescue") return "Treated";
  if (status === "Treated") return "Ready for Adoption";
  return null;
};

/**
 * Returns the hex color associated with a given case status for web badges.
 *
 * @param status - Current status string of the report
 * @returns Hex color string for status badge background
 */
const getStatusColor = (status: string) => {
  switch (status) {
    case "Needs Help":
      return "#ff6b6b";
    case "Under Rescue":
      return "#ffd93d";
    case "Treated":
      return "#6bcf7f";
    case "Ready for Adoption":
      return "#4d96ff";
    default:
      return "#999";
  }
};

/**
 * Web implementation of the Case Details Screen component.
 *
 * Provides a lightweight web interface to view stray incident details, accept rescue cases,
 * update case statuses, and navigate back to profile or case lists.
 */
export default function CaseDetails() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  // Component State
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingRescue, setAcceptingRescue] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  /**
   * Helper function to safely evaluate route parameter strings.
   */
  const safe = (v: string | string[] | undefined): string =>
    Array.isArray(v) ? v[0] : v || "";

  // Route Parameters & User Context
  const caseId = safe(params.caseId);
  const isProfileStatusUpdate = safe(params.source) === "profile";
  const returnToPreviousScreen = () =>
    router.replace(isProfileStatusUpdate ? "/profile" : "/(tabs)/Report");
  const isRescuer = Boolean(
    user && ["volunteer", "ngo", "vet", "rescuer"].includes(user.role)
  );
  const nextStatus = report ? getNextStatus(report.status) : null;

  // Fetch report details on component mount / caseId change
  useEffect(() => {
    (async () => {
      try {
        const data = await getReportByCaseId(caseId);
        setReport(data);
      } catch (err) {
        console.error("Error loading case:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId]);

  // Render activity loading spinner
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Render missing case fallback error UI
  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Case not found</Text>
      </View>
    );
  }

  /**
   * Assigns the case to the current rescuer and redirects to response workflow.
   */
  const acceptRescue = async () => {
    setAcceptingRescue(true);
    try {
      const token = await SecureStore.getItemAsync("authToken");
      const response = await axios.post(
        `${API_URL}/strays/report/${caseId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data as any;
      router.push({
        pathname: "/rescuer-response/[requestId]",
        params: { requestId: data.requestId, caseId },
      } as never);
    } catch (err: any) {
      Alert.alert("Accept Failed", err?.response?.data?.message || "This case could not be accepted.");
    } finally {
      setAcceptingRescue(false);
    }
  };

  /**
   * Updates the status of the current case to the next progression step.
   */
  const handleStatusUpdate = async () => {
    if (!report || !nextStatus || !report.permissions?.canUpdate) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateCaseStatus(report.caseId, nextStatus);
      setReport(updated);

      // Redirect to adoption post creation if case reaches Ready for Adoption
      if (nextStatus === "Ready for Adoption") {
        router.push({
          pathname: "/adoption-corner/CreateAdoptionPost",
          params: { caseId: report.caseId },
        } as never);
      }
    } catch (err: any) {
      Alert.alert("Update Failed", err?.message || "The case status could not be updated.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {/* Animal Type Header */}
        <Text style={styles.title}>{report.animalType}</Text>

        {/* Current Case Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(report.status) },
          ]}
        >
          <Text style={styles.statusText}>{report.status}</Text>
        </View>

        {/* Accept Rescue Case Button (Rescuers only) */}
        {isRescuer && report.permissions?.canAccept && (
          <PrimaryButton
            title={acceptingRescue ? "Accepting..." : "Accept This Case"}
            onPress={acceptRescue}
            disabled={acceptingRescue}
          />
        )}

        {/* Status Progression Button (Authorized Rescuer only) */}
        {isProfileStatusUpdate && nextStatus && report.permissions?.canUpdate && (
          <PrimaryButton
            title={updatingStatus ? "Updating..." : `Mark as "${nextStatus}"`}
            onPress={handleStatusUpdate}
            disabled={updatingStatus}
          />
        )}

        {/* Case Category Details */}
        <View style={styles.section}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{report.category}</Text>
        </View>

        {/* Optional Animal Breed */}
        {report.breed && (
          <View style={styles.section}>
            <Text style={styles.label}>Breed:</Text>
            <Text style={styles.value}>{report.breed}</Text>
          </View>
        )}

        {/* Incident Location Address */}
        <View style={styles.section}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{report.location?.address || "Unknown location"}</Text>
        </View>

        {/* Condition Notes */}
        {report.notes && (
          <View style={styles.section}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.value}>{report.notes}</Text>
          </View>
        )}

        {/* Web Map Placeholder Notice */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>
            📍 Map view available on mobile app
          </Text>
        </View>

        {/* Navigation Action Button */}
        <PrimaryButton
          title={isProfileStatusUpdate ? "Back to Profile" : "Back to Cases"}
          onPress={returnToPreviousScreen}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: "#666",
  },
  mapPlaceholder: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginVertical: 16,
  },
  mapText: {
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#ff6b6b",
  },
});

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

const getNextStatus = (status: string) => {
  if (status === "Under Rescue") return "Treated";
  if (status === "Treated") return "Ready for Adoption";
  return null;
};

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

export default function CaseDetails() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingRescue, setAcceptingRescue] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const safe = (v: string | string[] | undefined): string =>
    Array.isArray(v) ? v[0] : v || "";

  const caseId = safe(params.caseId);
  const isProfileStatusUpdate = safe(params.source) === "profile";
  const isRescuer = Boolean(
    user && ["volunteer", "ngo", "vet", "rescuer"].includes(user.role)
  );
  const nextStatus = report ? getNextStatus(report.status) : null;

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Case not found</Text>
      </View>
    );
  }

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

  const handleStatusUpdate = async () => {
    if (!report || !nextStatus || !report.permissions?.canUpdate) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateCaseStatus(report.caseId, nextStatus);
      setReport(updated);
    } catch (err: any) {
      Alert.alert("Update Failed", err?.message || "The case status could not be updated.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{report.animalType}</Text>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(report.status) },
          ]}
        >
          <Text style={styles.statusText}>{report.status}</Text>
        </View>

        {isRescuer && report.permissions?.canAccept && (
          <PrimaryButton
            title={acceptingRescue ? "Accepting..." : "Accept This Case"}
            onPress={acceptRescue}
            disabled={acceptingRescue}
          />
        )}

        {isProfileStatusUpdate && nextStatus && report.permissions?.canUpdate && (
          <PrimaryButton
            title={updatingStatus ? "Updating..." : `Mark as "${nextStatus}"`}
            onPress={handleStatusUpdate}
            disabled={updatingStatus}
          />
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{report.category}</Text>
        </View>

        {report.breed && (
          <View style={styles.section}>
            <Text style={styles.label}>Breed:</Text>
            <Text style={styles.value}>{report.breed}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{report.location.address}</Text>
        </View>

        {report.notes && (
          <View style={styles.section}>
            <Text style={styles.label}>Notes:</Text>
            <Text style={styles.value}>{report.notes}</Text>
          </View>
        )}

        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapText}>
            📍 Map view available on mobile app
          </Text>
        </View>

        <PrimaryButton
          title="Back to Cases"
          onPress={() => router.push("/reporting")}
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

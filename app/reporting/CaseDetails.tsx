import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { getReportByCaseId, updateCaseStatus } from "../../api/stray-api.service";
import PrimaryButton from "../../components/PrimaryButton";

type Report = {
  caseId: string;
  animalType: string;
  breed?: string;
  category: string;
  status: string;
  notes?: string;
  anonymous?: boolean;
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
  }[];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Needs Help":
      return "red";
    case "Under Rescue":
      return "yellow";
    case "Treated":
      return "green";
    case "Ready for Adoption":
      return "blue";
    default:
      return "gray";
  }
};

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

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 🔔 Notification States
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    const loadCase = async () => {
      try {
        const data = await getReportByCaseId(caseId as string);
        setReport(data);
      } catch (err: any) {
        console.log("Error loading case:", err);
        setLoadError(err?.message || "Failed to load case details.");
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [caseId]);

  const handleStatusUpdate = async () => {
    if (!report) return;

    const next = getNextStatus(report.status);
    if (!next) return;

    try {
      const updated = await updateCaseStatus(report.caseId, next);
      setReport(updated);

      // 🔔 Show banner immediately when status changes
      setNotificationMessage(`Case updated: ${next}`);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (err) {
      console.log("Failed to update status:", err);
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
        <Text style={styles.statusText}>{report.status}</Text>
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

        <Text style={styles.label}>Reported As</Text>
        <Text style={styles.value}>
          {report.anonymous ? "Anonymous User" : "Identified User"}
        </Text>

        <Text style={styles.label}>Location</Text>
        <Text style={styles.value}>{report.location?.address || "Unknown"}</Text>
      </View>

      {report.location?.lat != null && report.location?.lng != null && (
        <MapView
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
        </MapView>
      )}

      {/* Notes */}
      <View style={styles.sectionCard}>
        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>{report.notes || "No additional notes"}</Text>
      </View>

      {nextStatus && (
        <PrimaryButton
          title={`Mark as "${nextStatus}"`}
          onPress={handleStatusUpdate}
        />
      )}

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
              <Text style={styles.timelineTime}>
                {new Date(entry.timestamp).toLocaleString()}
              </Text>
              {entry.message && (
                <Text style={styles.timelineMessage}>{entry.message}</Text>
              )}
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
    marginBottom: 10,
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
});
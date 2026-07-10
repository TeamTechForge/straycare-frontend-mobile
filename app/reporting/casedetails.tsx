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
import { getReportByCaseId, updateCaseStatus } from "../../api/strayApi";
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
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const loadCase = async () => {
      try {
        const data = await getReportByCaseId(caseId as string);
        setReport(data);
      } catch (err) {
        console.log("Error loading case:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, []);

  const handleStatusUpdate = async () => {
    if (!report) return;

    const next = getNextStatus(report.status);
    if (!next) return;

    try {
      const updated = await updateCaseStatus(report.caseId, next);
      setReport(updated);
    } catch (err) {
      console.log("Failed to update status:", err);
    }
  };

  if (loading || !report) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading case details...</Text>
      </View>
    );
  }

  const statusColor = getStatusColor(report.status);
  const nextStatus = getNextStatus(report.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.caseId}>Case ID: {report.caseId}</Text>

      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{report.status}</Text>
      </View>

      <Text style={styles.label}>Photos</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        {report.photos && report.photos.length > 0 ? (
          report.photos.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.photo} />
          ))
        ) : (
          <Text style={styles.value}>No photos available</Text>
        )}
      </ScrollView>

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
      <Text style={styles.value}>{report.location.address}</Text>

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

      <Text style={styles.label}>Notes</Text>
      <Text style={styles.value}>{report.notes || "No additional notes"}</Text>

      {nextStatus && (
        <PrimaryButton
          title={`Mark as "${nextStatus}"`}
          onPress={handleStatusUpdate}
        />
      )}

      <PrimaryButton title="Back to Map" onPress={() => router.push("/reporting")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fafafa" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  caseId: { fontSize: 20, fontWeight: "700", marginBottom: 10 },

  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  statusText: { color: "white", fontWeight: "700" },

  label: { fontSize: 14, fontWeight: "600", marginTop: 20, color: "#444" },
  value: { fontSize: 16, marginTop: 4 },

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
});

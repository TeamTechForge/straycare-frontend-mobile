import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { getReportByCaseId } from "../../api/strayApi";
import PrimaryButton from "../../components/PrimaryButton";

// ------------------ TYPE FIX ------------------
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

export default function CaseDetailsScreen() {
  const { caseId } = useLocalSearchParams();
  const [report, setReport] = useState<Report | null>(null); // FIXED
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

  if (loading || !report) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading case details...</Text>
      </View>
    );
  }

  // ------------------ STATUS COLORS FIX ------------------
  const statusColor =
    report.status === "Needs Help"
      ? "red"
      : report.status === "Under Rescue"
      ? "yellow"
      : report.status === "Treated"
      ? "green"
      : "blue";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.caseId}>Case ID: {report.caseId}</Text>

      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{report.status}</Text>
      </View>

      {/* ------------------ BASIC INFO ------------------ */}
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

      {/* ------------------ LOCATION ------------------ */}
      <Text style={styles.label}>Location</Text>
      <Text style={styles.value}>{report.location.address}</Text>

      <MapView
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

      {/* ------------------ NOTES ------------------ */}
      <Text style={styles.label}>Notes</Text>
      <Text style={styles.value}>{report.notes || "No additional notes"}</Text>

      {/* ------------------ BACK BUTTON ------------------ */}
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

  map: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 10,
  },
});

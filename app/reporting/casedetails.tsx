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

 // Report Type Definition-represents the full structure of a single rescue case including all details needed
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

  // Timeline entries returned from backend
  timeline?: {
    status: string;
    timestamp: string;
    message?: string;
  }[];
};


const getStatusColor = (status: string) => {    // Maps each rescue status to a color used in UI badges and timeline indicators.
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

const getNextStatus = (current: string) => {    // Determines the next logical rescue status
  switch (current) {
    case "Needs Help":
      return "Under Rescue";
    case "Under Rescue":
      return "Treated";
    case "Treated":
      return "Ready for Adoption";
    default:
      return null;     // No further status
  }
};

export default function CaseDetailsScreen() {
  const { caseId } = useLocalSearchParams();      // Reads the dynamic route parameter from the URL and extract the caseId to fetch the correct report)
  const router = useRouter();                     

  // STATE 
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  // Load case details from backendFetches  
  useEffect(() => {
    const loadCase = async () => {
      try {                                      // Error handling - ensures UI doesn't break if API fails.
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


  const handleStatusUpdate = async () => {        // Sends request to backend to update the case status.
    if (!report) return;

    const next = getNextStatus(report.status);
    if (!next) return;

    try {
      const updated = await updateCaseStatus(report.caseId, next);
      setReport(updated); // Refresh UI with updated timeline + status
    } catch (err) {
      console.log("Failed to update status:", err);
    }
  };

  // LOADING STATE 
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
      
      {/* HEADER */}
      <Text style={styles.caseId}>Case ID: {report.caseId}</Text>

      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{report.status}</Text>
      </View>

      {/* PHOTOS */}
      <Text style={styles.label}>Photos :</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        {report.photos && report.photos.length > 0 ? (
          report.photos.map((uri: string, index: number) => (
            <Image key={index} source={{ uri }} style={styles.photo} />
          ))
        ) : (
          <Text style={styles.value}>No photos available</Text>
        )}
      </ScrollView>

      {/* BASIC INFO */}
      <Text style={styles.label}>Animal Type :</Text>
      <Text style={styles.value}>{report.animalType}</Text>

      <Text style={styles.label}>Breed :</Text>
      <Text style={styles.value}>{report.breed || "Unknown"}</Text>

      <Text style={styles.label}>Category :</Text>
      <Text style={styles.value}>{report.category}</Text>

      <Text style={styles.label}>Reported As :</Text>
      <Text style={styles.value}>
        {report.anonymous ? "Anonymous User" : "Identified User"}
      </Text>

      {/* LOCATION */}
      <Text style={styles.label}>Location :</Text>
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

      {/* NOTES */}
      <Text style={styles.label}>Notes :</Text>
      <Text style={styles.value}>{report.notes || "No additional notes"}</Text>

      {/* STATUS UPDATE BUTTON */}
      {nextStatus && (
        <PrimaryButton
          title={`Mark as "${nextStatus}"`}
          onPress={handleStatusUpdate}
        />
      )}

      {/* TIMELINE SECTION  */}
      <Text style={styles.label}>Rescue Timeline :</Text>

      {report.timeline && report.timeline.length > 0 ? (
        report.timeline.map(
          (
            entry: { status: string; timestamp: string; message?: string },
            index: number
          ) => (
            <View key={index} style={styles.timelineItem}>
              {/* Timeline dot */}
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: getStatusColor(entry.status) },
                ]}
              />

              {/* Timeline content */}
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
          )
        )
      ) : (
        <Text style={styles.value}>No timeline updates yet</Text>
      )}

      {/* BACK BUTTON */}
      <PrimaryButton title="Back to Map" onPress={() => router.push("/reporting")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fafafa" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  caseId: { fontSize: 24, fontWeight: "900", marginBottom: 12, textAlign: 'center' },

  statusBadge: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "center",
    marginBottom: 20,
  },
  statusText: { color: "white", fontWeight: "700" },

  label: { fontSize: 16, fontWeight: "600", marginTop: 22, color: "#514f4f" },
  value: { fontSize: 17, marginTop: 6},

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

  // TIMELINE STYLES 
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
});

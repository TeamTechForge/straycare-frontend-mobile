import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { getAllReports } from "../../api/strayApi";

// ---------- TYPES ----------
type Report = {
  caseId: string;
  animalType: string;
  category: string;
  status: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
};

export default function ReportingMapScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadReports = async () => {
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (err) {
      console.log("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load once on mount
  useEffect(() => {
    loadReports();
  }, []);

  // Refresh when returning to screen
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {reports.map((report) => {
          if (!report.location ||
  report.location.lat == null ||
  report.location.lng == null
) {
  return null;
}

          return (
            <Marker
              key={report.caseId}
              coordinate={{
                latitude: report.location.lat,
                longitude: report.location.lng,
              }}
              pinColor={
                report.status === "Needs Help"
                  ? "red"
                  : report.status === "Under Rescue"
                  ? "yellow"
                  : report.status === "Treated"
                  ? "green"
                  : "blue"
              }
              title={report.caseId}
              description={report.animalType}
              onPress={() =>
                router.push({
                  pathname: "/reporting/casedetails",
                  params: { caseId: report.caseId },
                })
              }
            />
          );
        })}
      </MapView>

      {/* ADD A CASE BUTTON */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/reporting/animal-details")}
      >
        <Text style={styles.addButtonText}>Add a Case +</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  addButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#FFB700",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});

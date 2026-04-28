import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { getAllReports } from "../../api/strayApi";

type Report = {     // Represents the minimal data needed to display a case on the map
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

// Maps each rescue status to a specific marker color.Used to visually differentiate case statuses on the map.
const getMarkerColor = (status: string) => {
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

export default function ReportingMapScreen() {
  const router = useRouter();

  // ------------------ STATE ------------------
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  
  // Fetches all reports from backend
  const loadReports = async () => {
    try {  // Error handling to catch any issues during data fetching and prevent app crashes. 
      const data = await getAllReports();
      setReports(data);
    } catch (err) {
      console.log("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

// Runs once when the screen mounts to load initial data
  useEffect(() => {
    loadReports();
  }, []);

  //Runs every time the user returns to this screen.Ensures the map always shows the latest case updates.
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  // LOADING STATE 
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* MAP VIEW  */}
      <MapView
        provider="google"
        style={styles.map}
        initialRegion={{
          latitude: 6.9271, // Default- Colombo
          longitude: 79.8612,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Render all case markers */}
        {reports.map((report) => {
          // Skip invalid or incomplete location data
          if (
            !report.location ||
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
              pinColor={getMarkerColor(report.status)}
              title={report.animalType}
              description={report.status}
              
              // On marker press navigate to Case Details screen ,pass the caseId so the next screen can fetch full details 
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

      {/* ADD CASE BUTTON */}
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
    bottom: 50,
    right: 120,
    backgroundColor: "#FFB700",
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 40,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },

  addButtonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "700",
  },
});

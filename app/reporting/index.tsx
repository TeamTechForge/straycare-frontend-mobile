import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { getAllReports } from "../../api/stray-api.service";
import PrimaryButton from "../../components/PrimaryButton";

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

const getMarkerColor = (status: string) => {
  switch (status) {
    case "Needs Help":
      return "red";
    case "Under Rescue":
      return "#f1eb40";
    case "Treated":
      return "#63ac84";
    case "Ready for Adoption":
      return "#2476da";
    default:
      return "gray";
  }
};

export default function ReportingMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

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

  useEffect(() => {
    loadReports();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  // The map's initialRegion only applies on first mount and never recenters,
  // so it was hiding every case outside that fixed Colombo box (including new
  // ones reported elsewhere). Refit the viewport whenever the report list changes.
  // fitToCoordinates is a no-op until the native map has actually finished
  // initializing, so this also waits on onMapReady rather than just the mount.
  useEffect(() => {
    if (!mapReady) return;

    const validCoords = reports
      .filter(
        (r) =>
          r.location && r.location.lat != null && r.location.lng != null
      )
      .map((r) => ({
        latitude: r.location.lat,
        longitude: r.location.lng,
      }));

    if (validCoords.length > 0) {
      mapRef.current?.fitToCoordinates(validCoords, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [reports, mapReady]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.header}>Rescue Cases Map</Text>
        <Text style={styles.subtext}>Tap a marker to view case details.</Text>
      </View>

      {/* Map View */}
      <MapView
        ref={mapRef}
        provider="google"
        style={styles.map}
        onMapReady={() => setMapReady(true)}
        initialRegion={{
          latitude: 6.9271, // Default - Colombo
          longitude: 79.8612,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {reports.map((report) => {
          if (
            !report.location ||
            report.location.lat == null ||
            report.location.lng == null
          ) {
            return null;
          }

          return (
            <Marker
              // ✅ Fix applied here: Forces the marker to re-render when status changes
              key={`${report.caseId}-${report.status}`}
              coordinate={{
                latitude: report.location.lat,
                longitude: report.location.lng,
              }}
              pinColor={getMarkerColor(report.status)}
              title={report.animalType}
              description={report.status}
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

      {/* Add Case Button */}
      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton
          title="Add a Case +"
          onPress={() => router.push("/reporting/animal-details")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  map: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    margin: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  header: { fontSize: 18, fontWeight: "700", color: "#333", textAlign: "center" },
  subtext: { fontSize: 14, color: "#666", textAlign: "center" },
  bottomButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
});
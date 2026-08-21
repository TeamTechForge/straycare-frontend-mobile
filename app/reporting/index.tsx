import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAllReports } from "../../api/strayApiService";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../components/BackButton";
import MapViewWrapper, { Marker } from "../../components/MapViewWrapper";
import PrimaryButton from "../../components/PrimaryButton";

/** Interface representing stray animal report data on the main map screen */
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

/** List of selectable case status filter categories */
const MAP_STATUSES = ["Needs Help", "Under Rescue", "Treated", "Ready for Adoption"] as const;

/**
 * Resolves map marker pin colors corresponding to case status state.
 *
 * @param status - Current case status string
 * @returns Color string for map pin marker
 */
const getMarkerColor = (status: string) => {
  switch (status) {
    case "Needs Help":
      return "red";                // 🔴 Newly reported / waiting
    case "Request Sent":
    case "Pending":
      return "#FFD700";            // 🟡 Request sent / waiting for response
    case "Under Rescue":
      return "orange";             // 🟠 Accepted / rescue in progress
    case "Treated":
    case "Completed":
      return "#63ac84";            // 🟢 Rescue completed
    case "Ready for Adoption":
      return "#2476da";            // 🔵 Ready for adoption
    case "Cancelled":
    case "Closed":
      return "gray";               // ⚫ Cancelled or closed
    default:
      return "gray";
  }
};

/**
 * RadarMarker Component.
 *
 * Renders an animated radar pulse effect marker for cases actively searching for a rescuer ("Pending"/"Request Sent"),
 * or a standard color-coded pin marker for confirmed case statuses.
 */
const RadarMarker = ({
  coordinate,
  status,
  onPress
}: {
  coordinate: { latitude: number; longitude: number };
  status: string;
  onPress: () => void;
}) => {
  const isSearching = status === "Pending" || status === "Request Sent";
  const radarAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation loop for active rescue search requests
  useEffect(() => {
    if (isSearching) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(radarAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(radarAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      radarAnim.stopAnimation();
    }
  }, [isSearching, radarAnim]);

  // Render animated pulse marker during active search
  if (isSearching) {
    return (
      <Marker coordinate={coordinate} onPress={onPress} anchor={{ x: 0.5, y: 0.5 }}>
        <View style={styles.radarContainer}>
          <Animated.View
            style={[
              styles.radarCircle,
              {
                opacity: radarAnim.interpolate({
                  inputRange: [0, 0.8, 1],
                  outputRange: [0.8, 0.2, 0],
                }),
                transform: [
                  {
                    scale: radarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 3],
                    }),
                  },
                ],
              },
            ]}
          />
        </View>
      </Marker>
    );
  }

  // Render standard pin marker
  return (
    <Marker
      coordinate={coordinate}
      pinColor={getMarkerColor(status)}
      onPress={onPress}
    />
  );
};

/**
 * Main Reporting Map Screen Component (Cross-platform default).
 *
 * Renders an interactive map of reported stray care cases with real-time status filtering,
 * animated radar markers for pending dispatches, auto-viewport bounds fitting, and reporting entry points.
 */
export default function ReportingMapScreen() {
  const mapRef = useRef<any>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Screen State
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    () => new Set(["Needs Help"])
  );

  /**
   * Toggles selection state of a case status filter chip.
   */
  const toggleStatus = (status: string) => {
    setSelectedStatuses((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  /**
   * Fetches latest stray reports from backend API.
   */
  const loadReports = useCallback(async () => {
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (err) {
      console.log("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch reports on mount
  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  // Refresh reports on screen focus
  useFocusEffect(
    useCallback(() => {
      void loadReports();
    }, [loadReports])
  );

  // Auto-fit map camera viewport to encompass all active report markers
  useEffect(() => {
    if (!mapReady) return;

    const validCoords = reports
      .filter((report) => selectedStatuses.has(report.status))
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
  }, [reports, mapReady, selectedStatuses]);

  // Intercept Android hardware back button to return to Home tab
  useEffect(() => {
    const onBackPress = () => {
      router.push("/(tabs)/Home");
      return true; // Prevent default behavior
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [router]);

  // Render loading indicator overlay
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <BackButton onPress={() => router.push("/(tabs)/Home")} />
          <View style={{ flex: 1 }}>
            <Text style={styles.header}>Rescue Cases Map</Text>
            <Text style={styles.subtext}>Tap a marker to view case details.</Text>
          </View>
          <TouchableOpacity
            onPress={() => void loadReports()}
            style={{ width: 40, alignItems: "center", justifyContent: "center" }}
            accessibilityLabel="Refresh Map"
          >
            <Ionicons name="refresh" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Map View */}
      <MapViewWrapper
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
        {/* Render Case Markers */}
        {reports.filter((report) => selectedStatuses.has(report.status)).map((report) => {
          if (
            !report.location ||
            report.location.lat == null ||
            report.location.lng == null
          ) {
            return null;
          }

          return (
            <RadarMarker
              key={report.caseId}
              coordinate={{
                latitude: report.location.lat,
                longitude: report.location.lng,
              }}
              status={report.status}
              onPress={() => {
                // Delay navigation slightly to prevent Android ViewManager crash
                // when unmounting/navigating during map gesture handling
                setTimeout(() => {
                  router.push({
                    pathname: "/reporting/CaseDetails",
                    params: { caseId: report.caseId },
                  });
                }, 50);
              }}
            />
          );
        })}
      </MapViewWrapper>

      {/* Floating Status Filter Card */}
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>Case status filters</Text>
        <View style={styles.filterRow}>
          {MAP_STATUSES.map((status) => {
            const selected = selectedStatuses.has(status);
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => toggleStatus(status)}
              >
                <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bottom Sticky Action Button to add a case */}
      <View style={[styles.bottomButtonWrapper, { bottom: insets.bottom + 115 }]}>
        <PrimaryButton
          title="Report a Case +"
          onPress={() => router.push("/reporting/AnimalDetails")}
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
  filterCard: {
    position: "absolute",
    top: 96,
    left: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    elevation: 2,
  },
  filterTitle: { fontSize: 12, fontWeight: "700", color: "#333", marginBottom: 7 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  filterChip: { borderWidth: 1, borderColor: "#BDBDBD", borderRadius: 14, paddingHorizontal: 9, paddingVertical: 5 },
  filterChipSelected: { backgroundColor: "#D32F2F", borderColor: "#D32F2F" },
  filterChipText: { color: "#444", fontSize: 11, fontWeight: "600" },
  filterChipTextSelected: { color: "#fff" },
  bottomButtonWrapper: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  radarContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  radarCircle: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(229, 57, 53, 0.4)", // Red radar
    borderWidth: 1,
    borderColor: "rgba(229, 57, 53, 0.8)",
  },
});

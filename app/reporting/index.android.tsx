import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { getAllReports } from "../../api/strayApiService";
import PrimaryButton from "../../components/PrimaryButton";
import {
  getPlaceDetails,
  type PlacePrediction,
  searchPlaces,
} from "../../services/places.service";

type CaseStatus =
  | "Needs Help"
  | "Under Rescue"
  | "Treated"
  | "Ready for Adoption";

type Report = {
  caseId: string;
  animalType: string;
  category?: string;
  status: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
};

type MapCoordinate = {
  latitude: number;
  longitude: number;
};

const POLL_INTERVAL_MS = 5000;
const MAP_DELTA = 0.025;
const DEFAULT_REGION = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const STATUS_OPTIONS: { status: CaseStatus; color: string }[] = [
  { status: "Needs Help", color: "#D32F2F" },
  { status: "Under Rescue", color: "#FBC02D" },
  { status: "Treated", color: "#2E7D32" },
  { status: "Ready for Adoption", color: "#1976D2" },
];

const MARKER_COLORS: Record<CaseStatus, string> = Object.fromEntries(
  STATUS_OPTIONS.map(({ status, color }) => [status, color])
) as Record<CaseStatus, string>;

const isCaseStatus = (status: string): status is CaseStatus =>
  STATUS_OPTIONS.some((option) => option.status === status);

const hasValidLocation = (report: Report): boolean =>
  Boolean(
    report.location &&
      Number.isFinite(Number(report.location.lat)) &&
      Number.isFinite(Number(report.location.lng))
  );

const createSessionToken = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;

export default function ReportingMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const mapReadyRef = useRef(false);
  const pendingCameraRef = useRef<MapCoordinate | null>(null);
  const reportsRef = useRef<Report[]>([]);
  const screenActiveRef = useRef(false);
  const requestInFlightRef = useRef(false);
  const fallbackFittedRef = useRef(false);
  const searchSessionRef = useRef<string | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [shouldFitReports, setShouldFitReports] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<CaseStatus>>(
    () => new Set<CaseStatus>(["Needs Help"])
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSelectionLocked, setSearchSelectionLocked] = useState(false);

  const animateToCoordinate = useCallback((coordinate: MapCoordinate) => {
    if (!mapReadyRef.current) {
      pendingCameraRef.current = coordinate;
      return;
    }

    mapRef.current?.animateToRegion(
      {
        ...coordinate,
        latitudeDelta: MAP_DELTA,
        longitudeDelta: MAP_DELTA,
      },
      500
    );
  }, []);

  const fitAllReports = useCallback((sourceReports: Report[]) => {
    if (!mapReadyRef.current) return false;

    const coordinates = sourceReports.filter(hasValidLocation).map((report) => ({
      latitude: Number(report.location.lat),
      longitude: Number(report.location.lng),
    }));

    if (coordinates.length === 0) return false;

    if (coordinates.length === 1) {
      animateToCoordinate(coordinates[0]);
    } else {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 120, right: 70, bottom: 180, left: 70 },
        animated: true,
      });
    }

    fallbackFittedRef.current = true;
    return true;
  }, [animateToCoordinate]);

  const loadReports = useCallback(async () => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;

    try {
      const data = (await getAllReports()) as Report[];
      if (!screenActiveRef.current) return;

      reportsRef.current = data;
      setReports(data);
      setRefreshError(null);
    } catch (error) {
      if (screenActiveRef.current) {
        console.error("[ReportingMap] Failed to refresh reports:", error);
        setRefreshError("Cases could not be refreshed. Retrying automatically.");
      }
    } finally {
      requestInFlightRef.current = false;
      if (screenActiveRef.current) setInitialLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      screenActiveRef.current = true;
      void loadReports();
      const pollTimer = setInterval(() => void loadReports(), POLL_INTERVAL_MS);

      return () => {
        screenActiveRef.current = false;
        clearInterval(pollTimer);
      };
    }, [loadReports])
  );

  const moveToCurrentLocation = useCallback(async () => {
    setLocating(true);
    setLocationMessage(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setHasLocationPermission(false);
        setLocationMessage(
          "Location permission is off. Showing all reported cases instead."
        );
        fallbackFittedRef.current = false;
        setShouldFitReports(true);
        fitAllReports(reportsRef.current);
        return;
      }

      setHasLocationPermission(true);
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setShouldFitReports(false);
      fallbackFittedRef.current = false;
      animateToCoordinate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      console.error("[ReportingMap] Current location failed:", error);
      setLocationMessage(
        "Your current location is unavailable. Showing all reported cases instead."
      );
      fallbackFittedRef.current = false;
      setShouldFitReports(true);
      fitAllReports(reportsRef.current);
    } finally {
      setLocating(false);
    }
  }, [animateToCoordinate, fitAllReports]);

  useEffect(() => {
    void moveToCurrentLocation();
  }, [moveToCurrentLocation]);

  useEffect(() => {
    if (
      shouldFitReports &&
      mapReady &&
      !fallbackFittedRef.current &&
      reports.length > 0
    ) {
      fitAllReports(reports);
    }
  }, [fitAllReports, mapReady, reports, shouldFitReports]);

  useEffect(() => {
    const input = searchQuery.trim();
    if (searchSelectionLocked || input.length < 2) {
      setPredictions([]);
      setSearchLoading(false);
      if (input.length < 2) setSearchError(null);
      return;
    }

    let active = true;
    const debounceTimer = setTimeout(async () => {
      const sessionToken = searchSessionRef.current || createSessionToken();
      searchSessionRef.current = sessionToken;
      setSearchLoading(true);
      setSearchError(null);

      try {
        const results = await searchPlaces(input, sessionToken);
        if (!active) return;
        setPredictions(results.slice(0, 5));
        if (results.length === 0) setSearchError("No locations found in Sri Lanka.");
      } catch (error) {
        if (!active) return;
        setPredictions([]);
        setSearchError(
          error instanceof Error ? error.message : "Location search failed."
        );
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(debounceTimer);
    };
  }, [searchQuery, searchSelectionLocked]);

  const choosePrediction = useCallback(
    async (prediction: PlacePrediction) => {
      const sessionToken = searchSessionRef.current || createSessionToken();
      setPredictions([]);
      setSearchLoading(true);
      setSearchError(null);

      try {
        const details = await getPlaceDetails(prediction.placeId, sessionToken);
        setSearchQuery(details.description || prediction.description);
        setSearchSelectionLocked(true);
        setFiltersOpen(false);
        Keyboard.dismiss();
        animateToCoordinate({
          latitude: details.latitude,
          longitude: details.longitude,
        });
      } catch (error) {
        setSearchError(
          error instanceof Error ? error.message : "Location details could not be loaded."
        );
      } finally {
        searchSessionRef.current = null;
        setSearchLoading(false);
      }
    },
    [animateToCoordinate]
  );

  const filteredReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          isCaseStatus(report.status) &&
          selectedStatuses.has(report.status) &&
          hasValidLocation(report)
      ),
    [reports, selectedStatuses]
  );

  const toggleStatus = (status: CaseStatus) => {
    setSelectedStatuses((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  useEffect(() => {
    const onBackPress = () => {
      router.push("/(tabs)/Home");
      return true;
    };
    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.sectionCard}>
        <Text style={styles.header}>Rescue Cases Map</Text>
        <Text style={styles.subtext}>Tap a marker to view case details.</Text>
      </View>

      <MapView
        ref={mapRef}
        provider="google"
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onMapReady={() => {
          mapReadyRef.current = true;
          setMapReady(true);
          if (pendingCameraRef.current) {
            const coordinate = pendingCameraRef.current;
            pendingCameraRef.current = null;
            animateToCoordinate(coordinate);
          }
        }}
      >
        {filteredReports.map((report) => (
          <Marker
            key={report.caseId}
            coordinate={{
              latitude: Number(report.location.lat),
              longitude: Number(report.location.lng),
            }}
            pinColor={MARKER_COLORS[report.status as CaseStatus]}
            onPress={() => {
              setTimeout(() => {
                router.push({
                  pathname: "/reporting/CaseDetails",
                  params: { caseId: report.caseId },
                });
              }, 50);
            }}
          />
        ))}
      </MapView>

      <View style={styles.controlsOverlay} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            placeholder="Search a location in Sri Lanka"
            placeholderTextColor="#8B8B8B"
            returnKeyType="search"
            onChangeText={(text) => {
              setSearchQuery(text);
              setSearchSelectionLocked(false);
              setFiltersOpen(false);
            }}
          />
          {searchLoading ? (
            <ActivityIndicator size="small" color="#F5A623" />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity
              accessibilityLabel="Clear location search"
              onPress={() => {
                setSearchQuery("");
                setPredictions([]);
                setSearchError(null);
                setSearchSelectionLocked(false);
                searchSessionRef.current = null;
              }}
            >
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
          <View style={styles.controlDivider} />
          <TouchableOpacity
            style={[styles.filterButton, filtersOpen && styles.filterButtonActive]}
            accessibilityLabel="Open case status filters"
            onPress={() => {
              Keyboard.dismiss();
              setPredictions([]);
              setFiltersOpen((open) => !open);
            }}
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={filtersOpen ? "#FFFFFF" : "#F5A623"}
            />
          </TouchableOpacity>
        </View>

        {predictions.length > 0 ? (
          <View style={styles.resultsPanel}>
            {predictions.map((prediction, index) => (
              <TouchableOpacity
                key={prediction.placeId}
                style={[
                  styles.resultRow,
                  index < predictions.length - 1 && styles.resultBorder,
                ]}
                onPress={() => void choosePrediction(prediction)}
              >
                <Ionicons name="location-outline" size={19} color="#F5A623" />
                <Text style={styles.resultText} numberOfLines={2}>
                  {prediction.description}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.googleAttribution}>Powered by Google</Text>
          </View>
        ) : searchError ? (
          <View style={styles.searchMessagePanel}>
            <Text style={styles.searchMessage}>{searchError}</Text>
          </View>
        ) : null}

        {filtersOpen ? (
          <View style={styles.filterPanel}>
            <Text style={styles.filterTitle}>Case status and marker colours</Text>
            <View style={styles.chipContainer}>
              {STATUS_OPTIONS.map(({ status, color }) => {
                const selected = selectedStatuses.has(status);
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusChip,
                      { borderColor: color },
                      selected && { backgroundColor: color },
                    ]}
                    onPress={() => toggleStatus(status)}
                  >
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: selected ? "#FFFFFF" : color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusChipText,
                        selected && styles.statusChipTextSelected,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedStatuses.size === 0 ? (
              <Text style={styles.emptyFilterText}>No case statuses selected.</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {locationMessage ? (
        <View style={styles.locationBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#7A4B00" />
          <Text style={styles.locationBannerText}>{locationMessage}</Text>
        </View>
      ) : null}

      {refreshError ? (
        <View style={styles.refreshBanner}>
          <Text style={styles.refreshBannerText}>{refreshError}</Text>
        </View>
      ) : null}

      {initialLoading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#F5A623" />
          <Text style={styles.loadingText}>Loading rescue cases...</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.locationButton}
        accessibilityLabel="Go to my current location"
        disabled={locating}
        onPress={() => void moveToCurrentLocation()}
      >
        {locating ? (
          <ActivityIndicator size="small" color="#F5A623" />
        ) : (
          <Ionicons name="locate" size={25} color="#F5A623" />
        )}
      </TouchableOpacity>

      <View style={styles.bottomButtonWrapper}>
        <PrimaryButton
          title="Report a Case +"
          onPress={() => router.push("/reporting/AnimalDetails")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  map: { flex: 1 },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    margin: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  header: { fontSize: 18, fontWeight: "700", color: "#333333", textAlign: "center" },
  subtext: { fontSize: 14, color: "#666666", textAlign: "center" },
  controlsOverlay: {
    position: "absolute",
    top: 92,
    left: 12,
    right: 12,
    zIndex: 20,
    elevation: 20,
  },
  searchRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 6,
  },
  searchInput: { flex: 1, color: "#222222", fontSize: 15, paddingVertical: 10 },
  controlDivider: { width: 1, height: 28, backgroundColor: "#E5E7EB" },
  filterButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  filterButtonActive: { backgroundColor: "#F5A623" },
  resultsPanel: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 8,
  },
  resultRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  resultBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#E5E7EB" },
  resultText: { flex: 1, color: "#303030", fontSize: 14 },
  googleAttribution: {
    color: "#777777",
    fontSize: 10,
    textAlign: "right",
    paddingRight: 12,
    paddingBottom: 7,
  },
  searchMessagePanel: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    elevation: 5,
  },
  searchMessage: { color: "#8A4B08", fontSize: 13 },
  filterPanel: {
    marginTop: 6,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 8,
  },
  filterTitle: { color: "#333333", fontSize: 13, fontWeight: "700", marginBottom: 9 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 34,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  statusChipText: { color: "#333333", fontSize: 12, fontWeight: "600" },
  statusChipTextSelected: { color: "#FFFFFF" },
  emptyFilterText: { color: "#777777", fontSize: 12, marginTop: 9 },
  locationBanner: {
    position: "absolute",
    top: 150,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 10,
    backgroundColor: "#FFF3CD",
    paddingHorizontal: 11,
    paddingVertical: 9,
    elevation: 4,
  },
  locationBannerText: { flex: 1, color: "#7A4B00", fontSize: 12 },
  refreshBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 154,
    borderRadius: 9,
    backgroundColor: "#3F3F46E6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  refreshBannerText: { color: "#FFFFFF", fontSize: 12 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  loadingText: { marginTop: 9, color: "#555555", fontSize: 13 },
  locationButton: {
    position: "absolute",
    right: 16,
    bottom: 156,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F4E1BE",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 7,
  },
  bottomButtonWrapper: {
    position: "absolute",
    bottom: 90,
    left: 20,
    right: 20,
  },
});

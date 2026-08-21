import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import axios from "axios";

// RescuerNavigationScreen.tsx
//
// In-App Navigation Screen for Rescuers.
// Features:
// 1. Live GPS tracking of the rescuer's device using expo-location.
// 2. Real-time mathematical distance calculation using Haversine formula.
// 3. Dynamic ETA (Estimated Time of Arrival) based on live distance to the animal.
// 4. Interactive Map showing rescuer marker ("You") and target animal location.

import MapViewWrapper, { Marker } from "../components/MapViewWrapper";
import BackButton from "../components/BackButton";
import { colors } from "../constants/colors.constants";
import { API_URL } from "../constants/config.constants";
import { fetchRescueById } from "../services/rescueService";
import { getStoredItem } from "../utils/storage";
import type { LiveTrackingResponse } from "../types/Api";

type Params = {
  requestId?: string | string[];
};

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/**
 * Calculates the great-circle distance between two GPS coordinates in kilometers
 * using the Haversine formula.
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export default function RescuerNavigationScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<Params>();
  const requestIdValue = getFirstParam(requestId) ?? "";

  /* ── Navigation States ─────────────────────────────────────────────── */
  const [tracking, setTracking] = useState<LiveTrackingResponse | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 📡 1. Live GPS tracking from rescuer's device using watchPositionAsync
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    (async () => {
      try {
        // Request foreground location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          // Get immediate initial position
          const currentPos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (currentPos?.coords) {
            setDeviceLocation({
              latitude: currentPos.coords.latitude,
              longitude: currentPos.coords.longitude,
            });
          }
          // Watch and update coordinates whenever the rescuer moves by 10 meters
          locationSubscription = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
            (loc) => {
              if (loc?.coords) {
                setDeviceLocation({
                  latitude: loc.coords.latitude,
                  longitude: loc.coords.longitude,
                });
              }
            }
          );
        }
      } catch (locErr) {
        console.warn("[RescuerNavigation] GPS permission/location error:", locErr);
      }
    })();

    // Remove location listener on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // 📡 2. Fetch rescue case details & calculate live distance / ETA
  useEffect(() => {
    let active = true;

    const loadTracking = async () => {
      if (!requestIdValue) return;
      try {
        let response: any = null;
        try {
          response = await fetchRescueById(requestIdValue);
        } catch (_fetchErr) {
          // Fallback: fetch via authenticated stray/rescue API
          const authToken = await getStoredItem("authToken");
          const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
          try {
            const res = await axios.get(`${API_URL}/rescue/status/${requestIdValue}`, { headers });
            response = res.data;
          } catch (_resErr) {
            const fallbackRes = await axios.get(`${API_URL}/strays/report/${requestIdValue}`, { headers });
            response = fallbackRes.data;
          }
        }

        if (!active || !response) return;

        // Resolve target destination coordinates of the reported animal
        const targetLocation =
          response.reporterLocation ||
          response.rescueLocation ||
          response.location ||
          (response.location?.lat ? { latitude: response.location.lat, longitude: response.location.lng } : null);

        // Resolve current rescuer coordinates
        const currentRescuerLoc =
          deviceLocation ||
          response.rescuerLocation ||
          (response.rescuer?.location ? { latitude: response.rescuer.location.lat || response.rescuer.location.latitude, longitude: response.rescuer.location.lng || response.rescuer.location.longitude } : null);

        let derivedDistanceKm: number = typeof response.distanceKm === "number" ? response.distanceKm : 0;
        let derivedEtaMinutes: number = typeof response.etaMinutes === "number" ? response.etaMinutes : 5;

        // Recalculate distance and ETA dynamically using current GPS coordinates
        if (currentRescuerLoc && targetLocation) {
          derivedDistanceKm = calculateDistanceKm(
            currentRescuerLoc.latitude,
            currentRescuerLoc.longitude,
            targetLocation.latitude || targetLocation.lat,
            targetLocation.longitude || targetLocation.lng
          );
          derivedEtaMinutes = Math.max(1, Math.round(derivedDistanceKm * 6));
        }

        setTracking({
          rescueRequestId: requestIdValue,
          status: response.status,
          case: response as any,
          reporterLocation: targetLocation,
          rescuerLocation: currentRescuerLoc,
          distanceKm: derivedDistanceKm,
          etaMinutes: derivedEtaMinutes,
          lastUpdatedAt: response.lastUpdatedAt || new Date().toISOString(),
        });
        setError(null);
      } catch (err) {
        if (!active) return;
        setError("Unable to load rescue location.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadTracking();
    const interval = setInterval(() => void loadTracking(), 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [requestIdValue, deviceLocation]);


  const initialRegion = useMemo(() => {
    const location = deviceLocation ?? tracking?.rescuerLocation ?? tracking?.reporterLocation ?? tracking?.case?.location;
    return location
      ? {
          latitude: location.latitude || (location as any).lat || 6.9271,
          longitude: location.longitude || (location as any).lng || 79.8612,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }
      : {
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
  }, [tracking, deviceLocation]);

  return (
    <View style={styles.container}>
      {tracking ? (
        <MapViewWrapper style={styles.map} initialRegion={initialRegion}>
          {tracking.reporterLocation ? (
            <Marker
              coordinate={tracking.reporterLocation}
              title="Rescue Location"
              description={tracking.case?.animalType || "Animal in need"}
              pinColor="#EF4444"
            />
          ) : null}
          {(deviceLocation || tracking.rescuerLocation) ? (
            <Marker
              coordinate={deviceLocation || tracking.rescuerLocation!}
              title="You"
              description="Your live location"
              pinColor={colors.primary}
            />
          ) : null}
        </MapViewWrapper>
      ) : (
        <View style={styles.loadingContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
      )}

      {/* OVERLAY HEADER (Back Button) */}
      <SafeAreaView style={styles.headerOverlay} pointerEvents="box-none">
        <BackButton onPress={() => router.back()} style={styles.backButton} />
      </SafeAreaView>

      {/* OVERLAY FOOTER (Distance & ETA) */}
      {tracking ? (
        <SafeAreaView style={styles.footerOverlay} pointerEvents="box-none">
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>DISTANCE</Text>
                <Text style={styles.infoValue}>
                  {typeof tracking.distanceKm === "number" && !isNaN(tracking.distanceKm)
                    ? tracking.distanceKm.toFixed(1)
                    : "0.0"}{" "}
                  km
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>ETA</Text>
                <Text style={styles.infoValue}>
                  {typeof tracking.etaMinutes === "number" && !isNaN(tracking.etaMinutes)
                    ? tracking.etaMinutes
                    : "—"}{" "}
                  min
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  footerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoBox: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
});

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

import MapViewWrapper, { Marker } from "../components/MapViewWrapper";
import { colors } from "../constants/colors.constants";
import { fetchRescueById } from "../services/rescueService";
import type { LiveTrackingResponse } from "../types/Api";

type Params = {
  requestId?: string | string[];
};

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function RescuerNavigationScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<Params>();
  const requestIdValue = getFirstParam(requestId) ?? "";

  const [tracking, setTracking] = useState<LiveTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadTracking = async () => {
      if (!requestIdValue) return;
      try {
        const response = await fetchRescueById(requestIdValue);
        if (!active) return;
        setTracking({
          rescueRequestId: requestIdValue,
          status: response.status,
          case: response as any, // Cast to match interface requirements if needed
          reporterLocation: response.reporterLocation,
          rescuerLocation: response.rescuerLocation,
          distanceKm: response.distanceKm as number,
          etaMinutes: response.etaMinutes as number,
          lastUpdatedAt: response.lastUpdatedAt,
        });
        setError(null);
      } catch (err) {
        if (!active) return;
        setError("Unable to load live location.");
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
  }, [requestIdValue]);

  const initialRegion = useMemo(() => {
    const location = tracking?.rescuerLocation ?? tracking?.reporterLocation ?? tracking?.case.location;
    return location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }
      : {
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
  }, [tracking]);

  return (
    <View style={styles.container}>
      {tracking ? (
        <MapViewWrapper style={styles.map} initialRegion={initialRegion}>
          {tracking.reporterLocation ? (
            <Marker
              coordinate={tracking.reporterLocation}
              title="Reporter"
              description={tracking.case.reporter?.name || "Reporter"}
              pinColor="#2563EB"
            />
          ) : null}
          {tracking.rescuerLocation ? (
            <Marker
              coordinate={tracking.rescuerLocation}
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* OVERLAY FOOTER (Distance & ETA) */}
      {tracking ? (
        <SafeAreaView style={styles.footerOverlay} pointerEvents="box-none">
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>DISTANCE</Text>
                <Text style={styles.infoValue}>
                  {tracking.distanceKm ? tracking.distanceKm.toFixed(1) : "—"} km
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>ETA</Text>
                <Text style={styles.infoValue}>
                  {tracking.etaMinutes ?? "—"} min
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
  backIcon: {
    fontSize: 24,
    color: "#333",
    lineHeight: 28,
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

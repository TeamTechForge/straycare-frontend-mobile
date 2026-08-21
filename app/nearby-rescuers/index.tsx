import { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import axios from "axios";

// NearbyRescuersScreen (index.tsx)
//
// Proximity-Based Rescuer Discovery and Direct Dispatch Screen.
// Features:
// 1. 5 km radius search to discover active rescuers near the reported animal.
// 2. Interactive Map displaying discovered rescuers and reported animal location.
// 3. Nearest Rescuer selection card with distance, ETA, rating, and avatar.
// 4. "No Rescuers Nearby" fallback screen with option to publish case to the public map.
// 5. Direct dispatch workflow with live status polling (Accepted, Rejected, Cancelled).

import { useAuth } from "../../contexts/AuthContext";
import MapViewWrapper, { Marker } from "../../components/MapViewWrapper";
import PrimaryButton from "../../components/PrimaryButton";
import BackButton from "../../components/BackButton";
import { colors } from "../../constants/colors.constants";
import { spacing } from "../../constants/spacing.constants";
import { typography } from "../../constants/typography.constants";

type SearchParams = {
  lat?: string | string[];
  lng?: string | string[];
  caseId?: string | string[];
  animalType?: string | string[];
  animalPhoto?: string | string[];
  description?: string | string[];
};

type WorkflowState = "selecting" | "sending" | "waiting" | "accepted";

import { BASE_URL } from "../../constants/config.constants";

const API_BASE_URL = BASE_URL;

/**
 * Resolves animal and user avatar photo URLs (handles relative backend paths and absolute web URLs).
 */
const resolvePhotoUrl = (url: string | undefined | null): string => {
  if (!url || typeof url !== "string" || !url.trim()) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://") || url.startsWith("data:")) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${cleanUrl}`;
};

/**
 * Haversine formula to compute great-circle distance (in kilometers) between two coordinates.
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyRescuersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<SearchParams>();
  const { user } = useAuth();

  const { caseId, animalType, animalPhoto, description } = params;

  /* ── Coordinate and Discovery States ────────────────────────────────── */
  const [centerCoords, setCenterCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [rescuers, setRescuers] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  
  /* ── Dispatch Workflow States ───────────────────────────────────────── */
  const [workflowState, setWorkflowState] = useState<WorkflowState>("selecting");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(30);

  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);
  const [loadingRescuers, setLoadingRescuers] = useState<boolean>(false);
  const [sendingRequest, setSendingRequest] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);

  const hasRequestedLocation = useRef(false);

  // 1. Resolve animal coordinates passed via URL parameters or retrieve current GPS position
  useEffect(() => {
    const latParam = Array.isArray(params.lat) ? params.lat[0] : params.lat;
    const lngParam = Array.isArray(params.lng) ? params.lng[0] : params.lng;

    if (latParam && lngParam) {
      const parsedLat = Number(latParam);
      const parsedLng = Number(lngParam);

      if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
        console.log("[NearbyHelpMap] Using passed coordinates:", parsedLat, parsedLng);
        setCenterCoords({ latitude: parsedLat, longitude: parsedLng });
        setLoadingLocation(false);
        return;
      }
    }

    // Fallback: Get device GPS coordinates (e.g. if opened directly from activities tab)
    if (hasRequestedLocation.current) return;
    hasRequestedLocation.current = true;

    const getLocation = async () => {
      try {
        console.log("[NearbyHelpMap] Requesting device coordinates");
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required to view nearby rescuers.");
          setLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const nextCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        console.log("[NearbyHelpMap] Device coordinates retrieved:", nextCoords);
        setCenterCoords(nextCoords);
      } catch (error) {
        console.error("[NearbyHelpMap] Failed to get device location:", error);
        Alert.alert("Location Error", "Unable to get your current location.");
      } finally {
        setLoadingLocation(false);
      }
    };

    void getLocation();
  }, [params.lat, params.lng]);

  // ── Fetch and Sort Rescuers once coordinates are available ──────────────────
  useEffect(() => {
    if (!centerCoords) return;

    const fetchRescuers = async () => {
      setLoadingRescuers(true);
      try {
        console.log("[NearbyHelpMap] Fetching rescuers from:", `${API_BASE_URL}/api/rescue/rescuers`);
        const response = await axios.get(`${API_BASE_URL}/api/rescue/rescuers`);

        const rawRescuers = (response.data as any).rescuers || [];
        console.log(`[NearbyHelpMap] Found ${rawRescuers.length} total rescuers in DB`);

        // Filter: only available rescuers
        const available = rawRescuers.filter((r: any) => r.isAvailable === true);
        console.log(`[NearbyHelpMap] ${available.length} available rescuers`);

        // Calculate straight line distance, filter within 5km, and sort
        const sorted = available
          .map((r: any) => {
            const distance = getDistance(
              centerCoords.latitude,
              centerCoords.longitude,
              r.location.latitude,
              r.location.longitude
            );
            return { ...r, distance };
          })
          .filter((r: any) => r.distance <= 5)
          .sort((a: any, b: any) => a.distance - b.distance);

        setRescuers(sorted);
        setCurrentIndex(0);
      } catch (error) {
        console.error("[NearbyHelpMap] Error fetching rescuers:", error);
        Alert.alert("Search Failed", "Unable to load nearby rescuers. Please try again.");
      } finally {
        setLoadingRescuers(false);
      }
    };

    void fetchRescuers();
  }, [centerCoords]);

  // Reset image error state whenever selected index changes
  useEffect(() => {
    setAvatarError(false);
  }, [currentIndex]);

  // ── Filter available rescuers by exclude list and exclude reporter ──────────
  const filteredRescuers = rescuers.filter((r: any) => {
    if (excludeIds.includes(String(r._id))) return false;
    if (user && user._id) {
      const rescuerUserIdStr = r.userId ? String(r.userId) : "";
      const rescuerIdStr = r._id ? String(r._id) : "";
      const reporterIdStr = String(user._id);
      if (rescuerUserIdStr === reporterIdStr || rescuerIdStr === reporterIdStr) {
        return false;
      }
    }
    return true;
  });

  const selectedRescuer = filteredRescuers[currentIndex] || null;

  // Reset current index if it goes out of bounds
  useEffect(() => {
    if (currentIndex >= filteredRescuers.length && filteredRescuers.length > 0) {
      setCurrentIndex(0);
    }
  }, [excludeIds, filteredRescuers.length]);

  const excludeCurrentAndFindNext = (rescuerIdToExclude: string) => {
    console.log("[NearbyHelpMap] Excluding rescuer ID:", rescuerIdToExclude);
    setExcludeIds((prev: string[]) => [...prev, rescuerIdToExclude]);
    setCurrentIndex(0); // Reset index to focus on the next closest available
  };

  // ── Polling and Countdown Interval logic while Waiting ──────────────────────
  useEffect(() => {
    if (workflowState !== "waiting" || !requestId || !selectedRescuer) {
      return;
    }

    console.log("[NearbyHelpMap] Starting polling and countdown for request:", requestId);

    // 1. Status Polling Interval (every 3 seconds)
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/rescue/status/${requestId}`);
        const responseData = response.data as any;
        const rawStatus = String(responseData.status || "").toLowerCase();
        console.log("[NearbyHelpMap] Polled status:", responseData.status);

        if (rawStatus === "accepted" || rawStatus === "under rescue") {
          clearInterval(pollInterval);
          setWorkflowState("accepted");
        } else if (rawStatus === "rejected" || rawStatus === "failed") {
          clearInterval(pollInterval);
          const rejectedRescuerName = selectedRescuer.name;
          const rejectedRescuerId = selectedRescuer._id;

          Alert.alert(
            "Request Declined",
            `${rejectedRescuerName} declined your request. Please select another nearby rescuer.`,
            [
              {
                text: "OK",
                onPress: () => {
                  excludeCurrentAndFindNext(rejectedRescuerId);
                  setWorkflowState("selecting");
                },
              },
            ]
          );
        }
      } catch (err) {
        console.error("[NearbyHelpMap] Polling status error:", err);
      }
    }, 3000);

    // 2. Countdown Timer Interval (every 1 second)
    const countdownInterval = setInterval(() => {
      setCountdown((prev: number) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, [workflowState, requestId, selectedRescuer]);

  // ── Find Next Nearest (Circular Selection) ──────────────────────────────────
  const handleFindNextNearest = () => {
    if (filteredRescuers.length <= 1) return; // Keep displaying the same single available rescuer
    const nextIndex = (currentIndex + 1) % filteredRescuers.length;
    console.log(`[NearbyHelpMap] Cycling rescuer: ${currentIndex} -> ${nextIndex}`);
    setCurrentIndex(nextIndex);
  };

  // ── Send request only to selected rescuer ──────────────────────────────────
  const handleSendRequest = async () => {
    if (!selectedRescuer || !centerCoords) return;

    setWorkflowState("sending");

    const firstParam = (v: string | string[] | undefined) =>
      Array.isArray(v) ? v[0] : v || "";

    const resolvedCaseId = firstParam(caseId) || "";
    const resolvedAnimalType = firstParam(animalType) || "Unknown animal";
    const resolvedDescription = firstParam(description) || "Stray animal needs help";
    const resolvedPhoto = firstParam(animalPhoto) || "";

    try {
      console.log(`[NearbyHelpMap] Sending request to rescuer: ${selectedRescuer.name} (${selectedRescuer._id})`);
      const response = await axios.post(`${API_BASE_URL}/api/rescue/send-request`, {
        rescuerId: selectedRescuer._id,
        caseId: resolvedCaseId,
        animalType: resolvedAnimalType,
        description: resolvedDescription,
        photos: resolvedPhoto ? [resolvedPhoto] : [],
      });

      const responseData = response.data as any;
      console.log("[NearbyHelpMap] Send request success:", responseData);

      setRequestId(responseData.requestId);
      setCountdown(30);
      setWorkflowState("waiting");
    } catch (error: any) {
      console.error("[NearbyHelpMap] Error sending rescue request:", error);
      Alert.alert(
        "Request Failed",
        error?.response?.data?.error || "Failed to send rescue request. Please try again."
      );
      setWorkflowState("selecting");
    }
  };

  // ── Cancel request and find next rescuer ──────────────────────────────────
  const handleCancelRequest = async () => {
    if (!requestId || !selectedRescuer) return;

    setSendingRequest(true);
    try {
      console.log(`[NearbyHelpMap] Cancelling request ID: ${requestId}`);
      await axios.patch(`${API_BASE_URL}/api/rescue/request/${requestId}/cancel`);

      Alert.alert(
        "Request Cancelled",
        "Your request was cancelled successfully. Finding the next nearest rescuer...",
        [{ text: "OK" }]
      );

      const cancelledId = selectedRescuer._id;
      excludeCurrentAndFindNext(cancelledId);
      setWorkflowState("selecting");
    } catch (error: any) {
      console.error("[NearbyHelpMap] Error cancelling request:", error);
      Alert.alert("Cancellation Failed", "Failed to cancel the request. Please try again.");
    } finally {
      setSendingRequest(false);
    }
  };

  // ─── Render loading indicator ────────────────────────────────────────────────
  if (loadingLocation || loadingRescuers) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {loadingLocation ? "Determining your location..." : "Searching for nearest rescuers..."}
        </Text>
      </View>
    );
  }

  // ─── Render empty state if no coordinates are resolved ─────────────────────
  if (!centerCoords) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Coordinates not resolved.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const distanceFormatted = selectedRescuer ? selectedRescuer.distance.toFixed(1) : "0";
  const etaMinutes = selectedRescuer ? Math.max(3, Math.round(selectedRescuer.distance * 6)) : 0;
  const rawRescuerImg = selectedRescuer ? (
    selectedRescuer.avatar ||
    selectedRescuer.profileImage ||
    selectedRescuer.userId?.profileImage ||
    selectedRescuer.userId?.avatar ||
    selectedRescuer.user?.profileImage ||
    selectedRescuer.user?.avatar
  ) : null;
  const rescuerImg = resolvePhotoUrl(rawRescuerImg);
  const hasAvatar = Boolean(rescuerImg && typeof rescuerImg === "string" && rescuerImg.trim().length > 0 && !avatarError);
  const avatarUri = hasAvatar ? rescuerImg : "";

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER BAR */}
      <View style={styles.header}>
        <BackButton
          onPress={() => {
            if (workflowState !== "waiting" && workflowState !== "sending") {
              router.back();
            }
          }}
        />
        <Text style={styles.headerTitle}>Nearby Help Map</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* MAP */}
      <View style={styles.mapContainer}>
        <MapViewWrapper
          style={styles.map}
          initialRegion={{
            latitude: centerCoords.latitude,
            longitude: centerCoords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* Blue pin showing report/user coordinates */}
          <Marker coordinate={centerCoords} title={caseId ? "Report Location" : "You"} pinColor="blue" />

          {/* Highlight ONLY the currently selected available rescuer on the map */}
          {selectedRescuer && (
            <Marker
              coordinate={{
                latitude: selectedRescuer.location.latitude,
                longitude: selectedRescuer.location.longitude,
              }}
              title={selectedRescuer.name}
              description={`${distanceFormatted} km away`}
              pinColor="#E0B35A"
            />
          )}
        </MapViewWrapper>

        {/* FLOATING CARD */}
        <View style={styles.floatingCard}>
          {workflowState === "sending" && (
            <View style={styles.centerContainerCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Sending rescue request...</Text>
            </View>
          )}

          {workflowState === "selecting" && (
            selectedRescuer ? (
              <>
                {/* Profile Wrapper */}
                <View style={styles.profileRow}>
                  <View style={styles.avatarWrapper}>
                    {hasAvatar ? (
                      <Image
                        source={{ uri: avatarUri }}
                        style={styles.avatar}
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.emptyAvatar]}>
                        <Ionicons name="person" size={26} color="#9CA3AF" />
                      </View>
                    )}
                    <View style={styles.avatarBadge}>
                      <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
                    </View>
                  </View>

                  <View style={styles.profileInfo}>
                    <Text style={styles.rescuerName}>{selectedRescuer.name}</Text>
                    <Text style={styles.rescuerRole}>Certified Rescuer</Text>
                  </View>
                </View>

                {/* Stats Row */}
                <View style={styles.chipsRow}>
                  <View style={styles.chip}>
                    <Ionicons name="location-outline" size={13} color={colors.primary} />
                    <Text style={styles.chipText}>{distanceFormatted} km</Text>
                  </View>
                  <View style={styles.chip}>
                    <Ionicons name="time-outline" size={13} color={colors.primary} />
                    <Text style={styles.chipText}>~{etaMinutes} min</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonGroup}>
                  <PrimaryButton
                    title="Send Request to Nearest Rescuer"
                    onPress={handleSendRequest}
                  />

                  {filteredRescuers.length > 1 && (
                    <PrimaryButton
                      title="Find Next Nearest"
                      onPress={handleFindNextNearest}
                      variant="outline"
                    />
                  )}

                  <PrimaryButton
                    title="Publish Case to Rescue Map"
                    onPress={() => {
                      Alert.alert(
                        "Publish to Rescue Map",
                        "Your case will be published to the public map for all rescuers to view and accept.",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Publish Now",
                            onPress: () => router.push("/(tabs)/Report"),
                          },
                        ]
                      );
                    }}
                    variant="outline"
                  />
                </View>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={38} color="#9CA3AF" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyText}>No nearby rescuers are currently available.</Text>
                <Text style={styles.emptySubtext}>
                  You can publish your case directly to the public rescue map so any available rescuer or volunteer across the platform can see and accept it.
                </Text>
                <View style={styles.buttonGroup}>
                  <PrimaryButton
                    title="Publish Case to Rescue Map"
                    onPress={() => {
                      Alert.alert(
                        "Published to Map",
                        "Your case is now visible to all rescuers on the public map.",
                        [
                          {
                            text: "OK",
                            onPress: () => router.push("/(tabs)/Report"),
                          },
                        ]
                      );
                    }}
                  />
                  <PrimaryButton
                    title="Exit"
                    onPress={() => router.push("/")}
                    variant="outline"
                  />
                </View>
              </View>
            )
          )}

          {workflowState === "waiting" && selectedRescuer && (
            <>
              {/* Profile Wrapper */}
              <View style={styles.profileRow}>
                <View style={styles.avatarWrapper}>
                  {hasAvatar ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.avatar}
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.emptyAvatar]}>
                      <Ionicons name="person" size={26} color="#9CA3AF" />
                    </View>
                  )}
                  <View style={styles.avatarBadge}>
                    <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
                  </View>
                </View>

                <View style={styles.profileInfo}>
                  <Text style={styles.rescuerName}>{selectedRescuer.name}</Text>
                  <Text style={styles.rescuerRole}>Certified Rescuer</Text>
                </View>
              </View>

              {/* Waiting status badge */}
              <View style={styles.waitingBadge}>
                <ActivityIndicator size="small" color="#B8860B" style={{ marginRight: 8 }} />
                <Text style={styles.waitingBadgeText}>Waiting for Rescuer Response</Text>
              </View>

              {/* Countdown timer */}
              <View style={styles.timerRow}>
                <Text style={styles.timerText}>
                  {countdown > 0
                    ? `Rescuer has ${countdown}s to respond`
                    : "Rescuer is taking too long to respond."}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.cancelBtn, sendingRequest && styles.disabledButton]}
                  onPress={handleCancelRequest}
                  disabled={sendingRequest}
                >
                  <Text style={styles.cancelBtnText}>
                    {sendingRequest ? "Cancelling..." : "Cancel Request & Find Next Rescuer"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {workflowState === "accepted" && selectedRescuer && (
            <>
              {/* Profile Wrapper */}
              <View style={styles.profileRow}>
                <View style={styles.avatarWrapper}>
                  {hasAvatar ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.avatar}
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.emptyAvatar]}>
                      <Ionicons name="person" size={26} color="#9CA3AF" />
                    </View>
                  )}
                  <View style={styles.avatarBadge}>
                    <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
                  </View>
                </View>

                <View style={styles.profileInfo}>
                  <Text style={styles.rescuerName}>{selectedRescuer.name}</Text>
                  <Text style={styles.rescuerRole}>Certified Rescuer</Text>
                </View>
              </View>

              {/* Accepted status badge */}
              <View style={styles.acceptedBadge}>
                <Text style={styles.acceptedBadgeText}>✓ Request Accepted</Text>
              </View>

              {/* Success message */}
              <Text style={styles.successSubtext}>
                {selectedRescuer.name} has accepted your request and is on their way!
              </Text>

              {/* Action Buttons */}
              <View style={styles.buttonGroup}>
                <PrimaryButton
                  title="Go to Home"
                  onPress={() => router.replace("/(tabs)/Home")}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  backIconButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: colors.text,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF9F6",
    padding: spacing.xl,
  },
  centerContainerCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: typography.medium,
    color: colors.text,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: 16,
    fontFamily: typography.medium,
    color: "#E53935",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: "#000000",
  },
  floatingCard: {
    position: "absolute",
    bottom: 24,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emptyAvatar: {
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyAvatarText: {
    fontSize: 24,
  },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  avatarBadgeIcon: {
    fontSize: 10,
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  rescuerName: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: colors.text,
  },
  rescuerRole: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: "#6B7280",
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    alignSelf: "flex-start",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8EA",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.2)",
  },
  chipEmoji: {
    fontSize: 10,
  },
  chipText: {
    fontFamily: typography.semibold,
    fontSize: 11,
    color: colors.text,
  },
  buttonGroup: {
    width: "100%",
    gap: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: colors.text,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  waitingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7E6",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: "100%",
    justifyContent: "center",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "#FFE5B4",
  },
  waitingBadgeText: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: "#B8860B",
  },
  acceptedBadge: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  acceptedBadgeText: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: "#1B5E20",
  },
  timerRow: {
    marginBottom: spacing.md,
    alignItems: "center",
  },
  timerText: {
    fontFamily: typography.semibold,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  cancelBtn: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1.5,
    borderColor: "#D32F2F",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
    alignSelf: "stretch",
  },
  cancelBtnText: {
    color: "#D32F2F",
    fontSize: 16,
    fontWeight: "600",
  },
  successSubtext: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  disabledButton: {
    backgroundColor: "#d9d9d9",
    borderColor: "#d9d9d9",
    opacity: 0.6,
  },
});

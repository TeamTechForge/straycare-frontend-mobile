import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { io as ioClient } from "socket.io-client";

import MapViewWrapper, { Marker } from "../components/MapViewWrapper";
import AppButton from "../components/ui/AppButton";
import PrimaryButton from "../components/PrimaryButton";
import BackButton from "../components/BackButton";
import { colors } from "../constants/colors.constants";
import { spacing } from "../constants/spacing.constants";
import { BASE_URL } from "../constants/config.constants";
import { useAuth } from "../contexts/AuthContext";
import { useCall } from "../contexts/CallContext";
import { useChatApi } from "../hooks/useChatApi";
import { fetchRescueById } from "../services/rescueService";
import { liveTrackingStyles as styles } from "../styles/live-tracking.styles";
import type { LiveTrackingResponse } from "../types/Api";

type Params = {
  requestId?: string | string[];
  fromProfile?: string | string[];
  source?: string | string[];
};

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/* ──────────────────────────────────────────────
 * Fallback data when the backend is unreachable
 * ────────────────────────────────────────────── */
const buildFallbackResponse = (requestId: string): LiveTrackingResponse => {
  const reporterLocation = { latitude: 6.9271, longitude: 79.8612 };
  const rescuerLocation = { latitude: 6.935, longitude: 79.8725 };

  return {
    rescueRequestId: requestId,
    status: "pending",
    case: {
      rescueRequestId: requestId,
      caseId: requestId,
      status: "pending",
      animalType: "Rescue case",
      description: "Tracking the current rescue progress.",
      photos: [""],
      createdAt: new Date().toISOString(),
      completedAt: null,
      reporter: {
        id: "reporter-guest",
        name: "Reporter",
        location: reporterLocation,
      },
      rescuer: {
        id: "rescuer-guest",
        name: "Assigned rescuer",
        phone: "+94771234567",
        location: rescuerLocation,
      },
      location: rescuerLocation,
      distanceKm: 1.4,
      etaMinutes: 8,
      summary: "Live rescue tracking is active.",
    },
    reporterLocation,
    rescuerLocation,
    distanceKm: 1.4,
    etaMinutes: 8,
    lastUpdatedAt: new Date().toISOString(),
  };
};

/* ──────────────────────────────────────────────
 * Helper: format relative time ("2m ago", "1h ago")
 * ────────────────────────────────────────────── */
const timeAgo = (dateString: string): string => {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/* ──────────────────────────────────────────────
 * Helper: first letter of a name for the avatar
 * ────────────────────────────────────────────── */
const getInitial = (name: string) => (name ? name.charAt(0).toUpperCase() : "?");

/* ═══════════════════════════════════════════════
 *  Main Screen Component
 * ═══════════════════════════════════════════════ */
export default function LiveTrackingScreen() {
  const router = useRouter();
  const { requestId, fromProfile, source } = useLocalSearchParams<Params>();
  const requestIdValue = getFirstParam(requestId) ?? "";
  const isFromProfile = getFirstParam(fromProfile) === "true" || getFirstParam(source) === "profile";
  const { user } = useAuth();
  const { startCall } = useCall();
  const { createConversation } = useChatApi();

  // ── Rescue tracking state ──
  const [tracking, setTracking] = useState<LiveTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocationShared, setIsLocationShared] = useState<boolean>(false);
  const [liveRescuerLocation, setLiveRescuerLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const isReporter = useMemo(() => {
    if (!user || !tracking) return false;
    const currentUserId = String((user as any)._id || (user as any).id || "");
    const reporterId = String(
      tracking.case?.reporter?.id ||
      (tracking.case as any)?.reporterUserId ||
      (tracking.case as any)?.userId ||
      ""
    );
    return isFromProfile || (Boolean(currentUserId && reporterId) && currentUserId === reporterId);
  }, [user, tracking, isFromProfile]);

  const isRescuer = useMemo(() => {
    if (!user || !tracking) return false;
    const currentUserId = (user as any)._id || (user as any).id;
    const rescuerUserId = (tracking.case.rescuer as any)?.userId || tracking.case.rescuer?.id;
    return currentUserId && rescuerUserId && String(currentUserId) === String(rescuerUserId);
  }, [user, tracking]);

  const otherParty = useMemo(() => {
    if (!tracking) return null;
    if (isReporter) {
      return {
        role: "rescuer",
        id: (tracking.case.rescuer as any)?.userId || tracking.case.rescuer?.id,
        name: tracking.case.rescuer?.name || "Rescuer",
        phone: tracking.case.rescuer?.phone,
        avatar: tracking.case.rescuer?.avatar,
      };
    }
    if (isRescuer) {
      return {
        role: "reporter",
        id: tracking.case.reporter?.id,
        name: tracking.case.reporter?.name || "Reporter",
        phone: tracking.case.reporter?.phone,
        avatar: tracking.case.reporter?.avatar,
      };
    }
    return null;
  }, [tracking, isReporter, isRescuer]);

  // ── Real-time Socket Connection for Live Movement Updates ──
  useEffect(() => {
    if (!requestIdValue) return;

    const rescueSocket = ioClient(`${BASE_URL}/rescue`, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });

    const targetCaseId = tracking?.case?.caseId;

    rescueSocket.on("connect", () => {
      rescueSocket.emit("join_rescue", String(requestIdValue));
      if (targetCaseId && targetCaseId !== requestIdValue) {
        rescueSocket.emit("join_rescue", String(targetCaseId));
      }
    });

    rescueSocket.on("location_update", (data: any) => {
      console.log("[LiveTracking] location_update received:", data);
      if (data?.isSharing === false) {
        setIsLocationShared(false);
        setLiveRescuerLocation(null);
        return;
      }
      if (data?.lat && data?.lng) {
        setLiveRescuerLocation({ latitude: data.lat, longitude: data.lng });
        setIsLocationShared(true);
      } else if (data?.location?.latitude && data?.location?.longitude) {
        setLiveRescuerLocation({ latitude: data.location.latitude, longitude: data.location.longitude });
        setIsLocationShared(true);
      }
      if (typeof data?.isSharing === "boolean") {
        setIsLocationShared(data.isSharing);
        if (!data.isSharing) {
          setLiveRescuerLocation(null);
        }
      }
    });

    rescueSocket.on("location_sharing_status", (data: any) => {
      console.log("[LiveTracking] location_sharing_status received:", data);
      if (typeof data?.isSharing === "boolean") {
        setIsLocationShared(data.isSharing);
        if (!data.isSharing) {
          setLiveRescuerLocation(null);
        }
      }
    });

    return () => {
      rescueSocket.disconnect();
    };
  }, [requestIdValue, tracking?.case?.caseId]);

  /* ── Load rescue tracking data ── */
  useEffect(() => {
    if (!requestIdValue) {
      setError("Missing rescue request id.");
      setLoading(false);
      return;
    }

    let active = true;

    const loadTracking = async () => {
      try {
        const response = await fetchRescueById(requestIdValue);
        if (!active) return;
        setTracking({
          rescueRequestId: response.rescueRequestId,
          status: response.status,
          case: response,
          reporterLocation: response.reporterLocation,
          rescuerLocation: response.rescuerLocation,
          distanceKm: response.distanceKm,
          etaMinutes: response.etaMinutes,
          lastUpdatedAt: response.lastUpdatedAt,
        });
        setError(null);
      } catch (loadError) {
        if (!active) return;
        console.warn("[LiveTracking] Falling back to local demo data:", loadError);
        setTracking(buildFallbackResponse(requestIdValue));
        setError(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadTracking();

    // Poll every 5 seconds for live updates
    const interval = setInterval(() => {
      void loadTracking();
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [requestIdValue]);

  /* ── Handle Call Other Party (in-app) ── */
  const handleCallOtherParty = useCallback(() => {
    if (!otherParty || !otherParty.id) {
      Alert.alert(
        "Contact Unavailable",
        "The contact details for this user are not available yet.",
        [{ text: "OK" }]
      );
      return;
    }
    const isAnonymous = tracking?.case?.reporterName === "Anonymous Reporter";
    const caseId = tracking?.case?.caseId;
    const caseMongoId = tracking?.case?.rescueRequestId;

    let displayCaseId = caseId || caseMongoId?.toString().slice(-4) || 'Anon';
    if (displayCaseId.length === 24) {
        displayCaseId = displayCaseId.slice(-4);
    }

    const calleeName = isAnonymous 
      ? `Anonymous Reporter (${displayCaseId})` 
      : ((tracking?.case as any)?.reporter?.name || (tracking?.case as any)?.reporterName || "Reporter");
      
    const calleeAvatar = isAnonymous 
      ? "https://ui-avatars.com/api/?name=Anonymous+Reporter&background=FEB94B&color=fff" 
      : (otherParty.avatar || undefined);

    startCall(String(otherParty.id), calleeName, calleeAvatar);
  }, [otherParty, startCall, tracking]);

  /* ── Handle Message Other Party ── */
  const handleMessageOtherParty = useCallback(async () => {
    if (!user) {
      Alert.alert("Authentication required", "Please log in to message this user.");
      return;
    }

    if (!otherParty || !otherParty.id) {
      Alert.alert("Error", "Recipient details are not loaded yet.");
      return;
    }

    if (String((user as any)._id || (user as any).id) === String(otherParty.id)) {
      Alert.alert("Error", "You cannot message yourself.");
      return;
    }

    setLoading(true);
    try {
      const isAnonymous = (tracking?.case as any)?.reporterName === "Anonymous Reporter";
      const conversationType = isAnonymous ? "rescue" : "direct";
      const caseId = tracking?.case?.caseId;
      const caseMongoId = tracking?.case?.rescueRequestId;
      
      const relatedEntity = isAnonymous && caseMongoId 
        ? { kind: `StrayReport_${caseId || ''}`, item: caseMongoId, referenceId: caseId } 
        : undefined;

      const conversation = (await createConversation(String(otherParty.id), conversationType, relatedEntity)) as any;
      const otherParticipant = conversation.participants?.find(
        (p: any) => p._id !== ((user as any)._id || (user as any).id)
      );

      let displayCaseId = caseId || caseMongoId?.toString().slice(-4) || 'Anon';
      if (displayCaseId.length === 24) {
          displayCaseId = displayCaseId.slice(-4);
      }

      router.push({
        pathname: "/chat/[conversationId]",
        params: {
          conversationId: conversation._id,
          recipientName: isAnonymous ? `Anonymous Reporter (${displayCaseId})` : (otherParticipant?.name || otherParty.name || "Chat"),
          recipientId: String(otherParty.id),
          recipientImage: isAnonymous ? "https://ui-avatars.com/api/?name=Anonymous+Reporter&background=FEB94B&color=fff" : (otherParticipant?.profileImage || otherParty.avatar || ""),
        },
      });
    } catch (chatError: any) {
      console.error("[LiveTracking] Failed to start conversation:", chatError);
      Alert.alert(
        "Could Not Start Chat",
        chatError.message || "Something went wrong while starting the conversation."
      );
    } finally {
      setLoading(false);
    }
  }, [user, otherParty, createConversation, router]);

  const canShowRescuerLiveMovement = isLocationShared && isReporter;
  const currentRescuerLocation = liveRescuerLocation || (isLocationShared ? tracking?.rescuerLocation : null);

  /* ── Map region ── */
  const initialRegion = useMemo(() => {
    const rescuerLoc = canShowRescuerLiveMovement ? currentRescuerLocation : null;
    const location = tracking?.case.location ?? rescuerLoc ?? tracking?.reporterLocation;
    return location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }
      : {
          latitude: 6.9271,
          longitude: 79.8612,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        };
  }, [tracking, canShowRescuerLiveMovement, currentRescuerLocation]);

  /* ═══════════════════════════════════════════════
   *  Render
   * ═══════════════════════════════════════════════ */
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <BackButton onPress={() => router.back()} style={{ marginRight: 12 }} />
          <View>
            <Text style={[styles.title, { marginBottom: 0 }]}>Live Tracking</Text>
            <Text style={styles.subtitle}>Real-time Rescue Tracking</Text>
          </View>
        </View>

        {/* ── Loading / Error Banner ── */}
        {loading ? (
          <View style={styles.statusBanner}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.helperText}>Loading live rescue data...</Text>
          </View>
        ) : error ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusText}>{error}</Text>
          </View>
        ) : null}

        {tracking ? (
          <>
            {/* ══════════════════════════════════════════
             *  Map View
             * ══════════════════════════════════════════ */}
            <View style={styles.mapCard}>
              <MapViewWrapper style={styles.map} initialRegion={initialRegion}>
                {tracking.reporterLocation ? (
                  <Marker
                    coordinate={tracking.reporterLocation}
                    title="Reporter"
                    description={tracking.case.reporter.name}
                    pinColor="#2563EB"
                  />
                ) : null}
                {canShowRescuerLiveMovement && currentRescuerLocation ? (
                  <Marker
                    coordinate={currentRescuerLocation}
                    title="Rescuer"
                    description={tracking.case.rescuer?.name ?? "Assigned rescuer"}
                    pinColor={colors.primary}
                  />
                ) : null}
              </MapViewWrapper>
            </View>

            {/* Live location sharing message under the map (shown only to the reporter) */}
            {isReporter && !canShowRescuerLiveMovement && (
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFBEB",
                borderColor: "#FDE68A",
                borderWidth: 1,
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: 14,
                marginTop: 10,
                gap: 8,
              }}>
                <Ionicons name="location-outline" size={18} color="#D97706" />
                <Text style={{ flex: 1, fontSize: 13, color: "#92400E", fontFamily: "Inter-Medium", lineHeight: 18 }}>
                  Live location sharing is not enabled by the rescuer.
                </Text>
              </View>
            )}

            {/* ══════════════════════════════════════════
             *  Rescue Details Card
             * ══════════════════════════════════════════ */}
            <View style={styles.sectionCard}>
              <View style={{ marginBottom: 12, backgroundColor: "#FFF8EA", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(254,185,75,0.4)" }}>
                <Text style={{ fontWeight: "bold", color: "#B8860B", fontSize: 13 }}>
                  STATUS: {tracking.status.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.sectionTitle}>{tracking.case.animalType}</Text>
              <Text style={styles.metaText}>{tracking.case.description}</Text>

              {/* ETA & Distance chips — kept for rescuer workflow, hidden when accessed through profile */}
              {!isFromProfile && (
                <View style={styles.row}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Distance: {tracking.distanceKm.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>ETA: {tracking.etaMinutes} min</Text>
                  </View>
                </View>
              )}
            </View>

            {/* ══════════════════════════════════════════
             *  Animal & Contact Card
             * ══════════════════════════════════════════ */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Animal & Contact</Text>
              <Text style={styles.metaText}>Reporter: {tracking.case.reporter.name}</Text>
              <Text style={styles.metaText}>
                Rescuer: {tracking.case.rescuer?.name ?? "Awaiting assignment"}
              </Text>
              <Text style={styles.metaText}>
                Updated: {new Date(tracking.lastUpdatedAt).toLocaleString()}
              </Text>
            </View>

            {/* ══════════════════════════════════════════
             *  Call & Message Buttons (Profile Access Only)
             * ══════════════════════════════════════════ */}
            {isFromProfile && otherParty ? (
              <View style={{ flexDirection: "row", gap: 12, marginVertical: 12 }}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton 
                    title={`Call ${otherParty.role === "rescuer" ? "Rescuer" : "Reporter"}`} 
                    onPress={handleCallOtherParty} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton 
                    title="Message" 
                    onPress={handleMessageOtherParty} 
                    variant="outline"
                  />
                </View>
              </View>
            ) : null}

            {/* ══════════════════════════════════════════
             *  Rescue Progress Updates & Custom Notes
             * ══════════════════════════════════════════ */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Rescue Progress Updates</Text>

              {/* 1. Custom Progress Notes (summary) */}
              {tracking.case.summary && tracking.case.summary !== "Pending rescue request" && tracking.case.summary !== "Completed rescue" && tracking.case.summary.trim() !== "" ? (
                <View style={{ marginTop: 8 }}>
                  {tracking.case.summary.split("\n").filter((line: string) => line.trim() !== "").map((step: string, idx: number) => (
                    <View key={idx} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 10 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#F5A623", marginTop: 4 }} />
                      <Text style={{ flex: 1, fontSize: 13, color: "#374151", lineHeight: 18, fontFamily: "Inter-Medium" }}>
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* 2. Timeline Entries if available */}
              {tracking.case.timeline && Array.isArray(tracking.case.timeline) && tracking.case.timeline.length > 0 ? (
                <View style={{ marginTop: tracking.case.summary ? 12 : 6, borderTopWidth: tracking.case.summary ? 1 : 0, borderTopColor: "#F3F4F6", paddingTop: tracking.case.summary ? 10 : 0 }}>
                  <Text style={{ fontSize: 11, fontWeight: "bold", color: "#9CA3AF", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Case Timeline:</Text>
                  {tracking.case.timeline.map((entry: any, idx: number) => (
                    <View key={idx} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8, gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#10B981", marginTop: 4 }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#111827" }}>
                          {entry.status || "Update"}: {entry.message}
                        </Text>
                        {entry.timestamp ? (
                          <Text style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {(!tracking.case.summary || tracking.case.summary === "Pending rescue request" || tracking.case.summary === "Completed rescue" || !tracking.case.summary.trim()) && (!tracking.case.timeline || tracking.case.timeline.length === 0) && (
                <Text style={styles.metaText}>No progress updates posted yet.</Text>
              )}
            </View>
          </>
        ) : null}

        {/* Removed bottom back button */}
      </ScrollView>
    </SafeAreaView>
  );
}
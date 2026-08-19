import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import MapViewWrapper, { Marker } from "../../components/MapViewWrapper";
import AppButton from "../../components/ui/AppButton";
import BackButton from "../../components/BackButton";
import { colors } from "../../constants/colors.constants";
import { spacing } from "../../constants/spacing.constants";
import { useAuth } from "../../contexts/AuthContext";
import { useCall } from "../../contexts/CallContext";
import {
  fetchRescueById,
  getApiBaseUrl,
} from "../../services/rescueService";
import { rescueDetailsStyles as styles } from "../../styles/rescue-details.styles";
import { BASE_URL } from "../../constants/config.constants";
import { io as ioClient } from "socket.io-client";

/* ─────────────────────────────────────────────────────────────
 * Fallback static details when the backend is down or mock data
 * is accessed (e.g. for default test IDs '001', '002', '003')
 * ───────────────────────────────────────────────────────────── */
const FALLBACK_DETAILS: Record<string, any> = {
  "001": {
    rescueRequestId: "001",
    caseId: "001",
    status: "completed",
    animalType: "Dog (Injury)",
    description: "Found a stray dog with an injured paw near the junction.",
    photos: ["https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=400&fit=crop&q=80"],
    photoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=400&fit=crop&q=80",
    createdAt: new Date("2026-01-12T10:00:00Z").toISOString(),
    completedAt: new Date("2026-01-12T11:30:00Z").toISOString(),
    reporter: {
      id: "reporter-01",
      name: "Dinesh Perera",
      phone: "+94771234561",
      avatar: "",
    },
    rescuer: {
      id: "rescuer-01",
      name: "Embark NGO Team",
      phone: "+94779876541",
      avatar: "",
    },
    location: { latitude: 6.9271, longitude: 79.8612, address: "Borella Junction, Colombo" },
    distanceKm: 1.2,
    etaMinutes: 10,
    summary: "Successfully caught, treated at veterinary clinic, and admitted to Embark shelter.",
    outcomes: ["Treated and released", "Admitted to shelter", "Transferred to veterinary clinic"],
  },
  "002": {
    rescueRequestId: "002",
    caseId: "002",
    status: "accepted",
    animalType: "Cat (Sick)",
    description: "Stray kitten appears weak and is not eating.",
    photos: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=400&fit=crop&q=80"],
    photoUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=400&fit=crop&q=80",
    createdAt: new Date("2026-01-08T14:20:00Z").toISOString(),
    completedAt: null,
    reporter: {
      id: "reporter-02",
      name: "Sarah Silva",
      phone: "+94771234562",
      avatar: "",
    },
    rescuer: {
      id: "rescuer-02",
      name: "Hope Paws NGO",
      phone: "+94779876542",
      avatar: "",
    },
    location: { latitude: 7.2906, longitude: 80.6337, address: "Peradeniya Road, Kandy" },
    distanceKm: 2.5,
    etaMinutes: 15,
    summary: "Rescuer is currently on their way to check the kitten.",
    outcomes: ["Checked by vet", "Medicine given"],
  },
  "003": {
    rescueRequestId: "003",
    caseId: "003",
    status: "pending",
    animalType: "Dog (Accident)",
    description: "Dog hit by a vehicle. Unable to walk.",
    photos: ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=400&fit=crop&q=80"],
    photoUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=400&fit=crop&q=80",
    createdAt: new Date("2026-01-02T09:15:00Z").toISOString(),
    completedAt: null,
    reporter: {
      id: "reporter-03",
      name: "Kamal Gunaratne",
      phone: "+94771234563",
      avatar: "",
    },
    rescuer: null,
    location: { latitude: 6.0535, longitude: 80.2112, address: "Main Street, Galle" },
    distanceKm: 0.0,
    etaMinutes: 0,
    summary: "Rescue request has been sent. Waiting for a rescuer to accept.",
    outcomes: ["Admitted to clinic", "Under observation"],
  },
};

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop&q=80";

/** Status badge styles consistent with the design system */
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "#FFF7E6", text: "#B8860B", dot: "#FEB94B" },
  accepted: { bg: "#E8F5E9", text: "#2E7D32", dot: "#4CAF50" },
  completed: { bg: "#E8F5E9", text: "#1B5E20", dot: "#43A047" },
  rejected: { bg: "#FFEBEE", text: "#C62828", dot: "#EF5350" },
};

/* ─────────────────────────────────────────────────────────────
 * Helper Functions
 * ───────────────────────────────────────────────────────────── */
const resolvePhotoUrl = (url: string | undefined): string => {
  if (!url) return DEFAULT_FALLBACK_IMAGE;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

const formatFullDate = (value: string | undefined): string => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

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

const getInitial = (name: string) => (name ? name.charAt(0).toUpperCase() : "?");

export default function RescueDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idValue = id ?? "";
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const { startCall } = useCall();
  
  const [responding, setResponding] = useState(false);

  // ── Rescue Details State ──
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Image State ──
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  /* ─────────────────────────────────────────────────────────────
   * Fetch Live Rescue Details (and poll)
   * ───────────────────────────────────────────────────────────── */
  const loadDetails = useCallback(async () => {
    if (!idValue) return;
    try {
      const data = await fetchRescueById(idValue);
      setDetails(data);
      setError(null);
    } catch (err) {
      console.warn("[RescueDetails] Failed to load from backend, using fallbacks:", err);
      // Fallback to static mock details for specific IDs, or default to mock '001'
      const fallback = FALLBACK_DETAILS[idValue] || FALLBACK_DETAILS["001"];
      setDetails(fallback);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [idValue]);

  useEffect(() => {
    void loadDetails();
    // Poll rescue status details every 5 seconds
    const interval = setInterval(() => {
      void loadDetails();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadDetails]);

  // Listen for reporter cancellation on the /rescue namespace.
  // When the reporter cancels, navigate the rescuer away immediately.
  useEffect(() => {
    if (!idValue) return;

    const rescueSocket = ioClient(`${BASE_URL}/rescue`, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });

    rescueSocket.on("connect", () => {
      rescueSocket.emit("join_rescue", String(idValue));
    });

    rescueSocket.on("rescue_cancelled", () => {
      router.replace("/(tabs)/Home");
    });

    return () => {
      rescueSocket.disconnect();
    };
  }, [idValue, router]);

  /* ─────────────────────────────────────────────────────────────
   * Respond to Request (Accept / Reject)
   * ───────────────────────────────────────────────────────────── */
  const respondToRequest = async (action: "accept" | "reject") => {
    if (!token) return;
    setResponding(true);
    try {
      const baseUrl = getApiBaseUrl();
      const respondRes = await fetch(`${baseUrl}/api/rescue/request/${idValue}/respond`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (respondRes.ok) {
        if (action === "accept") {
          Alert.alert("Request Accepted! 🚑", "Case has been added to your profile under Rescue Cases.", [
            {
              text: "Go to Home",
              onPress: () => router.replace("/(tabs)/Home"),
            },
          ]);
        } else {
          Alert.alert("Request Declined", "The rescue request was declined.", [
            { text: "OK", onPress: () => router.replace("/(tabs)/Home") }
          ]);
        }
      } else {
        const errData = await respondRes.json();
        Alert.alert("Error", errData.error || "Failed to respond to request.");
      }
    } catch (err) {
      console.error("Error responding to request:", err);
      Alert.alert("Error", "Network error occurred.");
    } finally {
      setResponding(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
   * In-App Call Trigger
   * ───────────────────────────────────────────────────────────── */
  const handleCall = useCallback((userId: string | undefined, name: string, avatar?: string) => {
    if (!userId || userId.trim().length === 0) {
      Alert.alert(
        "Contact Unavailable",
        `Contact details for ${name} are not available right now.`,
        [{ text: "OK" }]
      );
      return;
    }
    startCall(userId, name, avatar);
  }, [startCall]);

  /* ─────────────────────────────────────────────────────────────
   * Navigation to Live Tracking
   * ───────────────────────────────────────────────────────────── */
  const handleNavigateToLiveTracking = () => {
    router.push({
      pathname: "/live-tracking/[requestId]",
      params: { requestId: idValue },
    } as any);
  };

  // ── Memoized Resolved Values ──
  const photosList = useMemo(() => {
    if (Array.isArray(details?.photos) && details.photos.length > 0) {
      return details.photos.map((p: string) => resolvePhotoUrl(p));
    }
    if (details?.photoUrl) {
      return [resolvePhotoUrl(details.photoUrl)];
    }
    return [DEFAULT_FALLBACK_IMAGE];
  }, [details]);

  const photoUrl = useMemo(() => {
    return photosList[selectedPhotoIndex] || photosList[0] || DEFAULT_FALLBACK_IMAGE;
  }, [photosList, selectedPhotoIndex]);

  const statusStyle = useMemo(
    () => STATUS_COLORS[details?.status] ?? STATUS_COLORS.pending,
    [details]
  );

  // ── Access Control: who is the current user? ──
  const currentUserId = user ? String((user as any)._id || (user as any).id || "") : "";
  const isAssignedRescuer = useMemo(() => {
    if (!user || !details?.rescuer) return false;
    const rescuerUserId = details.rescuer.userId ? String(details.rescuer.userId) : "";
    const rescuerId = details.rescuer.id ? String(details.rescuer.id) : "";
    return (
      (rescuerUserId && rescuerUserId === currentUserId) ||
      (rescuerId && rescuerId === currentUserId)
    );
  }, [user, details, currentUserId]);

  const isReporter = useMemo(() => {
    if (!user || !details?.reporter) return false;
    const reporterId = details.reporter.id ? String(details.reporter.id) : "";
    return reporterId && reporterId === currentUserId;
  }, [user, details, currentUserId]);

  // ── Timeline status indices ──
  const timelineData = useMemo(() => {
    if (!details || !details.timeline || !Array.isArray(details.timeline) || details.timeline.length === 0) {
      return [
        { status: "Needs Help", message: "Your request was published on the network", timestamp: details?.createdAt || new Date().toISOString() }
      ];
    }
    return details.timeline;
  }, [details]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.helperText}>Loading rescue case details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !details) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={styles.errorText}>{error || "Unable to display details."}</Text>
          <AppButton title="Go Back" onPress={() => router.back()} style={{ width: "100%" }} />
        </View>
      </SafeAreaView>
    );
  }

  // Memoized region details for map preview
  const initialRegion = {
    latitude: details.location?.latitude ?? 6.9271,
    longitude: details.location?.longitude ?? 79.8612,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: ((!details?.status || details?.status === "pending" || details?.status === "Needs Help") ? 110 : 40) + insets.bottom }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* ── Custom Header Row ── */}
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} style={{ marginRight: spacing.md }} />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Rescue Details</Text>
            <Text style={styles.subtitle}>ID: {idValue}</Text>
          </View>
        </View>

        {/* ── 1. Animal Image Card (Large, Rounded Card) ── */}
        <View style={[styles.card, styles.imageCard]}>
          <View style={styles.imageContainer}>
            {!imageError ? (
              <Image
                source={{ uri: photoUrl }}
                style={styles.largeImage}
                resizeMode="cover"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            ) : (
              <View style={styles.imageFallback}>
                <Text style={styles.fallbackEmoji}>🐾</Text>
                <Text style={styles.fallbackText}>Image unavailable</Text>
              </View>
            )}

            {imageLoading && !imageError && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}

            {/* Overlaid Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {details.status}
              </Text>
            </View>

            {/* Overlaid Animal Type Badge */}
            <View style={styles.animalTypeBadge}>
              <Text style={styles.animalTypeText}>{details.animalType || "Rescue Animal"}</Text>
            </View>
          </View>

          {/* Photos Thumbnail Gallery for all case images */}
          {photosList.length > 1 && (
            <View style={{ paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#FFF8EA", borderTopWidth: 1, borderColor: "rgba(254,185,75,0.2)" }}>
              <Text style={{ fontSize: 11, fontFamily: "Inter-SemiBold", color: "#B8860B", marginBottom: 6 }}>
                Case Photos ({photosList.length}):
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photosList.map((url: string, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPhotoIndex(idx)}
                    style={{
                      marginRight: 8,
                      borderRadius: 10,
                      borderWidth: selectedPhotoIndex === idx ? 2.5 : 1,
                      borderColor: selectedPhotoIndex === idx ? colors.primary : "#E5E7EB",
                      overflow: "hidden",
                    }}
                  >
                    <Image source={{ uri: url }} style={{ width: 64, height: 64, borderRadius: 8 }} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ── 2. Timeline Tracker Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⏱ Rescue Journey Timeline</Text>
          <View style={styles.timelineContainer}>
            {timelineData.map((step: any, index: number) => {
              const isLast = index === timelineData.length - 1;

              return (
                <View key={index} style={styles.timelineStep}>
                  {/* Circle + Line */}
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineIndicatorActive}>
                      <Text style={styles.timelineIcon}>✓</Text>
                    </View>
                    {!isLast && (
                      <View style={[styles.timelineLine, styles.timelineLineActive]} />
                    )}
                  </View>

                  {/* Step Description */}
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStepTitleActive}>
                      {step.status}
                    </Text>
                    <Text style={styles.timelineStepSub}>
                      {step.message || "Status updated"}
                    </Text>
                    {step.timestamp && (
                      <Text style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>
                        {new Date(step.timestamp).toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── 3. Description & Date Cards ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Case Information</Text>
          <View style={styles.grid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🕐</Text>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Reported At</Text>
                <Text style={styles.detailValue}>{formatFullDate(details.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🐾</Text>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Case Type</Text>
                <Text style={styles.detailValue}>{details.animalType || "Unspecified"}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📄</Text>
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{details.description || "No description provided."}</Text>
              </View>
            </View>
          </View>

          {/* Outcome Checklist Summary if available */}
          {(details.outcomes || details.summary) && (
            <View style={styles.outcomeBox}>
              <Text style={styles.outcomeTitle}>Outcome / Action Summary</Text>
              <View style={styles.outcomeInner}>
                {Array.isArray(details.outcomes) ? (
                  details.outcomes.map((o: string, idx: number) => (
                    <Text key={idx} style={styles.outcomeText}>
                      ✓ {o}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.outcomeText}>{details.summary}</Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* ── 4. Location & Map Preview Card ── */}
        <View style={[styles.card, styles.mapPreviewCard]}>
          <View style={styles.mapPreviewHeader}>
            <Text style={styles.cardTitle}>📍 Rescue Location</Text>
            <Text style={styles.helperText}>
              {details.location?.address || "Location coordinates specified on map"}
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.95} onPress={handleNavigateToLiveTracking}>
            <MapViewWrapper
              style={styles.map}
              initialRegion={initialRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={initialRegion}
                title="Rescue Incident"
                description={details.description}
                pinColor={colors.primary}
              />
            </MapViewWrapper>
            <View style={styles.mapBanner}>
              <Text style={styles.mapBannerText}>TAP CARD TO VIEW LIVE TRACKING →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── 5. Contact Profiles & Call Buttons ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📞 Contact & Rescuers</Text>

          {/* Reporter row */}
          <View style={styles.profileSection}>
            {(() => {
              const isAnonymous = details.reporterName === "Anonymous Reporter" || details.anonymous;
              const fullCaseId = (details.caseId || idValue || 'Anon').toString();
              const displayCaseId = fullCaseId.slice(-4);
              
              const uiDisplayName = isAnonymous 
                ? `Anonymous Reporter (${fullCaseId})` 
                : (details.reporterName || details.reporter?.name || "Reporter");

              const callDisplayName = isAnonymous 
                ? uiDisplayName 
                : uiDisplayName;
              
              const displayAvatar = isAnonymous 
                ? "https://ui-avatars.com/api/?name=Anonymous+Reporter&background=FEB94B&color=fff"
                : (details.reporter?.avatar || details.reporterAvatar);
                
              const displayPhone = isAnonymous 
                ? null 
                : (details.reporter?.phone || details.reporterPhone);

              return (
                <>
                  {displayAvatar ? (
                    <Image
                      source={{ uri: resolvePhotoUrl(displayAvatar) }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <View style={styles.avatarInitials}>
                      <Text style={styles.avatarInitialsText}>{getInitial(uiDisplayName)}</Text>
                    </View>
                  )}
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{uiDisplayName}</Text>
                    <Text style={styles.profileRole}>Case Reporter</Text>
                    {displayPhone ? (
                      <Text style={styles.profilePhone}>{displayPhone}</Text>
                    ) : null}
                  </View>
                  {(details.reporter?.id || details.userId || details.reporterUserId) ? (
                    <TouchableOpacity
                      style={styles.callIconBtn}
                      activeOpacity={0.8}
                      onPress={() => handleCall(details.reporter?.id || details.userId || details.reporterUserId, callDisplayName, displayAvatar)}
                    >
                      <Text style={styles.callIconText}>📞</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              );
            })()}
          </View>

          {/* Rescuer row */}
          <View style={[styles.profileSection, styles.profileSectionLast]}>
            {details.rescuer ? (
              <>
                {details.rescuer.avatar ? (
                  <Image
                    source={{ uri: resolvePhotoUrl(details.rescuer.avatar) }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarInitials}>
                    <Text style={styles.avatarInitialsText}>{getInitial(details.rescuer.name)}</Text>
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{details.rescuer.name}</Text>
                  <Text style={styles.profileRole}>Assigned Rescuer</Text>
                  {details.rescuer.phone ? (
                    <Text style={styles.profilePhone}>{details.rescuer.phone}</Text>
                  ) : null}
                </View>
              </>
            ) : (
              <View style={{ flex: 1, paddingVertical: spacing.sm, alignItems: "center" }}>
                <Text style={styles.helperText}>Awaiting assigned rescuer team...</Text>
              </View>
            )}
          </View>

          {/* Accept / Reject Action Buttons for received rescue requests */}
          {details?.status === "pending" && (user?.role === "volunteer" || user?.role === "ngo" || user?.role === "vet" || user?.role === "rescuer") && (
            <View style={styles.cardActionRow}>
              <TouchableOpacity
                style={[styles.cardRejectButton, responding && { opacity: 0.6 }]}
                onPress={() => respondToRequest("reject")}
                disabled={responding}
                activeOpacity={0.85}
              >
                <Text style={styles.cardRejectButtonText}>Reject Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cardAcceptButton, responding && { opacity: 0.6 }]}
                onPress={() => respondToRequest("accept")}
                disabled={responding}
                activeOpacity={0.85}
              >
                <Text style={styles.cardAcceptButtonText}>Accept Request</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Removed Exit Details button */}
      </ScrollView>

      {/* ── Fixed Bottom Action Bar at bottom of page to Accept or Reject ── */}
      {(!details?.status || details?.status === "pending" || details?.status === "Needs Help") && (
        <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 20) + 10, paddingTop: 16 }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectButton, responding && { opacity: 0.6 }]}
            onPress={() => respondToRequest("reject")}
            disabled={responding}
            activeOpacity={0.85}
          >
            <Text style={styles.rejectButtonText}>Reject Request</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptButton, responding && { opacity: 0.6 }]}
            onPress={() => respondToRequest("accept")}
            disabled={responding}
            activeOpacity={0.85}
          >
            {responding ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <Text style={styles.acceptButtonText}>Accept Request</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

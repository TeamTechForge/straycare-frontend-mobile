import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import MapViewWrapper, { Marker } from "../../components/MapViewWrapper";
import AppButton from "../../components/ui/AppButton";
import { colors } from "../../constants/colors.constants";
import { spacing } from "../../constants/spacing.constants";
import { useAuth } from "../../contexts/AuthContext";
import { useCall } from "../../contexts/CallContext";
import {
  fetchComments,
  fetchRescueById,
  getApiBaseUrl,
  postComment,
  postReply,
} from "../../services/RescueService";
import { rescueDetailsStyles as styles } from "../../styles/rescue-details.styles";
import type { RescueComment } from "../../types/Api";

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

  // ── Comments State ──
  const [comments, setComments] = useState<RescueComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // ── Replies State ──
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

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

  /* ─────────────────────────────────────────────────────────────
   * Fetch Comments (and poll)
   * ───────────────────────────────────────────────────────────── */
  const loadCommentsList = useCallback(async () => {
    if (!idValue) return;
    setCommentsLoading(true);
    try {
      const data = await fetchComments(idValue);
      setComments(data);
    } catch (err) {
      console.warn("[RescueDetails] Failed to load comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  }, [idValue]);

  useEffect(() => {
    void loadCommentsList();
    // Poll comments every 10 seconds
    const interval = setInterval(() => {
      void loadCommentsList();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadCommentsList]);

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
          await loadDetails(); // refresh to show accepted state
        } else {
          router.replace("/"); // go back if rejected
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
   * Post Comment / Reply Handlers
   * ───────────────────────────────────────────────────────────── */
  const handlePostComment = useCallback(async () => {
    if (!newComment.trim() || !idValue) return;
    setSubmittingComment(true);
    try {
      const currentUserId = (user as any)?._id || (user as any)?.id || "guest-user";
      const currentUserName = (user as any)?.name || "User";
      const created = await postComment(idValue, newComment.trim(), currentUserName, currentUserId);
      setComments((prev) => [...prev, { ...created, replies: created.replies || [] }]);
      setNewComment("");
    } catch (err) {
      Alert.alert("Error", "Failed to post comment. Please try again.", [{ text: "OK" }]);
      console.error("[RescueDetails] Post comment failed:", err);
    } finally {
      setSubmittingComment(false);
    }
  }, [newComment, idValue, user]);

  const handlePostReply = useCallback(
    async (parentId: string) => {
      if (!replyText.trim() || !idValue) return;
      setSubmittingReply(true);
      try {
        const currentUserId = (user as any)?._id || (user as any)?.id || "guest-user";
        const currentUserName = (user as any)?.name || "User";
        const created = await postReply(idValue, parentId, replyText.trim(), currentUserName, currentUserId);
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentId ? { ...c, replies: [...(c.replies || []), created] } : c
          )
        );
        setReplyText("");
        setReplyingTo(null);
      } catch (err) {
        Alert.alert("Error", "Failed to post reply. Please try again.", [{ text: "OK" }]);
        console.error("[RescueDetails] Post reply failed:", err);
      } finally {
        setSubmittingReply(false);
      }
    },
    [replyText, idValue, user]
  );

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
  const photoUrl = useMemo(() => resolvePhotoUrl(details?.photoUrl || details?.photos?.[0]), [
    details,
  ]);
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
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Custom Header Row ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
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
            <View style={styles.avatarInitials}>
              <Text style={styles.avatarInitialsText}>{getInitial(details.reporter?.name)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{details.reporter?.name || "Reporter"}</Text>
              <Text style={styles.profileRole}>Case Reporter</Text>
              {details.reporter?.phone ? (
                <Text style={styles.profilePhone}>{details.reporter.phone}</Text>
              ) : null}
            </View>
            {details.reporter?.phone ? (
              <TouchableOpacity
                style={styles.callIconBtn}
                activeOpacity={0.8}
                onPress={() => handleCall(details.reporter?.phone, details.reporter?.name)}
              >
                <Text style={styles.callIconText}>📞</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Rescuer row */}
          <View style={[styles.profileSection, styles.profileSectionLast]}>
            {details.rescuer ? (
              <>
                <View style={styles.avatarInitials}>
                  <Text style={styles.avatarInitialsText}>{getInitial(details.rescuer.name)}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{details.rescuer.name}</Text>
                  <Text style={styles.profileRole}>Assigned Rescuer</Text>
                  {details.rescuer.phone ? (
                    <Text style={styles.profilePhone}>{details.rescuer.phone}</Text>
                  ) : null}
                </View>
                {details.rescuer.phone ? (
                  <TouchableOpacity
                    style={styles.callIconBtn}
                    activeOpacity={0.8}
                    onPress={() => handleCall(details.rescuer?.phone, details.rescuer?.name)}
                  >
                    <Text style={styles.callIconText}>📞</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : (
              <View style={{ flex: 1, paddingVertical: spacing.sm, alignItems: "center" }}>
                <Text style={styles.helperText}>Awaiting assigned rescuer team...</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── 6. Threaded Comments Section ── */}
        <View style={[styles.card, { paddingBottom: spacing.sm }]}>
          <View style={styles.commentHeader}>
            <View style={styles.commentHeaderIcon}>
              <Text style={styles.commentHeaderEmoji}>💬</Text>
            </View>
            <Text style={styles.commentHeaderTitle}>Discussion Thread</Text>
            <Text style={styles.commentCount}>
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </Text>
          </View>

          {/* New comment composition */}
          {isAssignedRescuer || isReporter ? (
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Post a new update/comment..."
                placeholderTextColor="#9CA3AF"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
                editable={!submittingComment}
              />
              <TouchableOpacity
                style={[
                  styles.commentSendBtn,
                  (!newComment.trim() || submittingComment) && styles.commentSendBtnDisabled,
                ]}
                activeOpacity={0.8}
                onPress={handlePostComment}
                disabled={!newComment.trim() || submittingComment}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.commentSendIcon}>➤</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ padding: spacing.sm, alignItems: "center", backgroundColor: "#F9FAFB", borderRadius: 8, marginVertical: 8 }}>
              <Text style={[styles.helperText, { textAlign: "center" }]}>View Only — Only the assigned rescuer or reporter can post updates.</Text>
            </View>
          )}

          {/* Loader */}
          {commentsLoading && comments.length === 0 ? (
            <View style={styles.commentLoading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.helperText}>Loading discussion...</Text>
            </View>
          ) : null}

          {/* Empty State */}
          {!commentsLoading && comments.length === 0 ? (
            <Text style={styles.commentEmpty}>No comments yet. Write a message above!</Text>
          ) : null}

          {/* Comments List */}
          {comments.map((comment) => (
            <View key={comment._id}>
              {/* Comment Bubble */}
              <View style={styles.commentBubble}>
                <View style={styles.commentBubbleHeader}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{getInitial(comment.userId === ((user as any)?._id || (user as any)?.id) ? "You" : comment.userName)}</Text>
                  </View>
                  <Text style={styles.commentUserName}>{comment.userId === ((user as any)?._id || (user as any)?.id) ? "You" : comment.userName}</Text>
                  <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>

                <View style={styles.commentActions}>
                  <TouchableOpacity
                    style={styles.replyTrigger}
                    activeOpacity={0.7}
                    onPress={() => {
                      setReplyingTo(replyingTo === comment._id ? null : comment._id);
                      setReplyText("");
                    }}
                  >
                    <Text style={styles.replyTriggerText}>
                      {replyingTo === comment._id ? "Cancel" : "↩ Reply"}
                    </Text>
                  </TouchableOpacity>
                  {comment.replies && comment.replies.length > 0 ? (
                    <Text style={styles.commentCount}>
                      {comment.replies.length}{" "}
                      {comment.replies.length === 1 ? "reply" : "replies"}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Replies list */}
              {comment.replies && comment.replies.length > 0 ? (
                <View style={styles.replyContainer}>
                  {comment.replies.map((reply) => (
                    <View key={reply._id} style={styles.replyBubble}>
                      <View style={styles.commentBubbleHeader}>
                        <View style={styles.commentAvatar}>
                          <Text style={styles.commentAvatarText}>
                            {getInitial(reply.userId === ((user as any)?._id || (user as any)?.id) ? "You" : reply.userName)}
                          </Text>
                        </View>
                        <Text style={styles.commentUserName}>{reply.userId === ((user as any)?._id || (user as any)?.id) ? "You" : reply.userName}</Text>
                        <Text style={styles.commentTime}>{timeAgo(reply.createdAt)}</Text>
                      </View>
                      <Text style={styles.commentText}>{reply.text}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Reply Input Composition */}
              {replyingTo === comment._id ? (
                <View style={styles.replyInputRow}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder={`Reply to ${comment.userName}...`}
                    placeholderTextColor="#9CA3AF"
                    value={replyText}
                    onChangeText={setReplyText}
                    multiline
                    maxLength={500}
                    editable={!submittingReply}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={[
                      styles.replySendBtn,
                      (!replyText.trim() || submittingReply) && styles.commentSendBtnDisabled,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handlePostReply(comment._id)}
                    disabled={!replyText.trim() || submittingReply}
                  >
                    {submittingReply ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.commentSendIcon}>➤</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {/* Removed Exit Details button */}
      </ScrollView>

      {/* ── Rescuer Action Bar ── */}
      {details?.status === "pending" && details?.rescuer && (user?._id === details.rescuer.id || user?._id === details.rescuer.userId) && (
        <View style={styles.actionBar}>
          <AppButton 
            title="Reject" 
            onPress={() => respondToRequest("reject")} 
            style={[styles.actionBtn, { backgroundColor: "#EF4444" }]} 
            disabled={responding}
          />
          <AppButton 
            title="Accept" 
            onPress={() => respondToRequest("accept")} 
            style={[styles.actionBtn, { backgroundColor: "#10B981" }]} 
            disabled={responding}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

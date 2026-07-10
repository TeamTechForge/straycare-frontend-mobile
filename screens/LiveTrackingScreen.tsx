import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import MapViewWrapper, { Marker } from "../components/MapViewWrapper";
import AppButton from "../components/ui/AppButton";
import { colors } from "../constants/colors.constants";
import { spacing } from "../constants/spacing.constants";
import { fetchComments, fetchRescueById, postComment, postReply } from "../services/rescue.service";
import { liveTrackingStyles as styles } from "../styles/live-tracking.styles";
import type { LiveTrackingResponse, RescueComment } from "../types/Api";

type Params = {
  requestId?: string | string[];
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
  const { requestId } = useLocalSearchParams<Params>();
  const requestIdValue = getFirstParam(requestId) ?? "";

  // ── Rescue tracking state ──
  const [tracking, setTracking] = useState<LiveTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Comments state ──
  const [comments, setComments] = useState<RescueComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // ── Reply state ──
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // comment _id
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

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

  /* ── Load comments ── */
  const loadComments = useCallback(async () => {
    if (!requestIdValue) return;
    setCommentsLoading(true);
    try {
      const data = await fetchComments(requestIdValue);
      setComments(data);
    } catch (err) {
      console.warn("[LiveTracking] Failed to load comments:", err);
      // Keep existing comments on error
    } finally {
      setCommentsLoading(false);
    }
  }, [requestIdValue]);

  useEffect(() => {
    void loadComments();
    // Poll comments every 10 seconds
    const interval = setInterval(() => {
      void loadComments();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadComments]);

  /* ── Handle call rescuer ── */
  const handleCallRescuer = useCallback(() => {
    const phone = tracking?.case.rescuer?.phone;
    if (!phone || phone.trim().length === 0) {
      Alert.alert(
        "Phone Number Unavailable",
        "The rescuer's phone number is not available yet. Please try again later.",
        [{ text: "OK" }]
      );
      return;
    }

    // Clean phone number (remove spaces, dashes)
    const cleanedPhone = phone.replace(/[\s-]/g, "");
    const url = `tel:${cleanedPhone}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Cannot Make Call", "Your device does not support phone calls.", [
            { text: "OK" },
          ]);
        }
      })
      .catch(() => {
        Alert.alert("Error", "An error occurred while trying to make the call.", [{ text: "OK" }]);
      });
  }, [tracking]);

  /* ── Handle post new comment ── */
  const handlePostComment = useCallback(async () => {
    if (!newComment.trim() || !requestIdValue) return;
    setSubmittingComment(true);
    try {
      const created = await postComment(requestIdValue, newComment.trim());
      // Optimistically add to list (with empty replies array)
      setComments((prev) => [...prev, { ...created, replies: created.replies || [] }]);
      setNewComment("");
    } catch (err) {
      Alert.alert("Error", "Failed to post comment. Please try again.", [{ text: "OK" }]);
      console.error("[LiveTracking] Post comment failed:", err);
    } finally {
      setSubmittingComment(false);
    }
  }, [newComment, requestIdValue]);

  /* ── Handle post reply ── */
  const handlePostReply = useCallback(
    async (parentId: string) => {
      if (!replyText.trim() || !requestIdValue) return;
      setSubmittingReply(true);
      try {
        const created = await postReply(requestIdValue, parentId, replyText.trim());
        // Optimistically add reply to the parent comment
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentId ? { ...c, replies: [...(c.replies || []), created] } : c
          )
        );
        setReplyText("");
        setReplyingTo(null);
      } catch (err) {
        Alert.alert("Error", "Failed to post reply. Please try again.", [{ text: "OK" }]);
        console.error("[LiveTracking] Post reply failed:", err);
      } finally {
        setSubmittingReply(false);
      }
    },
    [replyText, requestIdValue]
  );

  /* ── Map region ── */
  const initialRegion = useMemo(() => {
    const location = tracking?.case.location ?? tracking?.rescuerLocation ?? tracking?.reporterLocation;
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
  }, [tracking]);

  /* ═══════════════════════════════════════════════
   *  Render
   * ═══════════════════════════════════════════════ */
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Live Tracking</Text>
        <Text style={styles.subtitle}>Rescue request #{requestIdValue || "—"}</Text>

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
                {tracking.rescuerLocation ? (
                  <Marker
                    coordinate={tracking.rescuerLocation}
                    title="Rescuer"
                    description={tracking.case.rescuer?.name ?? "Assigned rescuer"}
                    pinColor={colors.primary}
                  />
                ) : null}
              </MapViewWrapper>
            </View>

            {/* ══════════════════════════════════════════
             *  Rescue Details Card
             * ══════════════════════════════════════════ */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{tracking.case.animalType}</Text>
              <Text style={styles.metaText}>{tracking.case.description}</Text>

              <View style={styles.row}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>Status: {tracking.status}</Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>Distance: {tracking.distanceKm.toFixed(1)} km</Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>ETA: {tracking.etaMinutes} min</Text>
                </View>
              </View>
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
              {tracking.case.rescuer?.phone ? (
                <Text style={styles.metaText}>Phone: {tracking.case.rescuer.phone}</Text>
              ) : null}
              <Text style={styles.metaText}>
                Updated: {new Date(tracking.lastUpdatedAt).toLocaleString()}
              </Text>
            </View>

            {/* ══════════════════════════════════════════
             *  📞 Call Rescuer Button
             * ══════════════════════════════════════════ */}
            <TouchableOpacity
              style={styles.callButton}
              activeOpacity={0.85}
              onPress={handleCallRescuer}
            >
              <View style={styles.callIconCircle}>
                <Text style={styles.callIcon}>📞</Text>
              </View>
              <Text style={styles.callButtonText}>
                Call Rescuer{tracking.case.rescuer?.name ? ` — ${tracking.case.rescuer.name}` : ""}
              </Text>
            </TouchableOpacity>

            {/* ══════════════════════════════════════════
             *  Tracking Notes Card
             * ══════════════════════════════════════════ */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Tracking Notes</Text>
              <Text style={styles.metaText}>
                {tracking.case.summary || "No tracking updates posted yet."}
              </Text>
            </View>

            {/* ══════════════════════════════════════════
             *  💬 Comment Section
             * ══════════════════════════════════════════ */}
            <View style={styles.commentCard}>
              {/* ── Header ── */}
              <View style={styles.commentHeader}>
                <View style={styles.commentHeaderIcon}>
                  <Text style={styles.commentHeaderEmoji}>💬</Text>
                </View>
                <Text style={styles.commentHeaderTitle}>Comments</Text>
                <Text style={styles.commentCount}>
                  {comments.length} {comments.length === 1 ? "comment" : "comments"}
                </Text>
              </View>

              {/* ── New Comment Input ── */}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write a comment..."
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
                    (!newComment.trim() || submittingComment) && { opacity: 0.5 },
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

              {/* ── Loading indicator ── */}
              {commentsLoading && comments.length === 0 ? (
                <View style={styles.commentLoading}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.helperText}>Loading comments...</Text>
                </View>
              ) : null}

              {/* ── Empty state ── */}
              {!commentsLoading && comments.length === 0 ? (
                <Text style={styles.commentEmpty}>
                  No comments yet. Be the first to share your thoughts!
                </Text>
              ) : null}

              {/* ── Comment List ── */}
              {comments.map((comment) => (
                <View key={comment._id}>
                  {/* ── Comment Bubble ── */}
                  <View style={styles.commentBubble}>
                    <View style={styles.commentBubbleHeader}>
                      <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarText}>
                          {getInitial(comment.userName)}
                        </Text>
                      </View>
                      <Text style={styles.commentUserName}>{comment.userName}</Text>
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

                  {/* ── Replies ── */}
                  {comment.replies && comment.replies.length > 0 ? (
                    <View style={styles.replyContainer}>
                      {comment.replies.map((reply) => (
                        <View key={reply._id} style={styles.replyBubble}>
                          <View style={styles.commentBubbleHeader}>
                            <View style={styles.commentAvatar}>
                              <Text style={styles.commentAvatarText}>
                                {getInitial(reply.userName)}
                              </Text>
                            </View>
                            <Text style={styles.commentUserName}>{reply.userName}</Text>
                            <Text style={styles.commentTime}>{timeAgo(reply.createdAt)}</Text>
                          </View>
                          <Text style={styles.commentText}>{reply.text}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* ── Reply Input (visible when replying to this comment) ── */}
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
                          (!replyText.trim() || submittingReply) && { opacity: 0.5 },
                        ]}
                        activeOpacity={0.8}
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
          </>
        ) : null}

        {/* ── Back Button ── */}
        <View style={{ marginTop: spacing.lg }}>
          <AppButton title="Back" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
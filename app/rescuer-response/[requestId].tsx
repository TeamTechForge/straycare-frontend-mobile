import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

import MapViewWrapper, { Marker } from "../../components/MapViewWrapper";
import PrimaryButton from "../../components/PrimaryButton";
import { colors } from "../../constants/colors.constants";
import { spacing } from "../../constants/spacing.constants";
import { typography } from "../../constants/typography.constants";
import { API_URL, BASE_URL } from "../../constants/config.constants";
import { io as ioClient } from "socket.io-client";
import { useCall } from "../../contexts/CallContext";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { fetchComments, postComment, postReply } from "../../services/rescueService";
import type { RescueComment } from "../../types/Api";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=200&h=200&fit=crop&q=80";

const resolvePhotoUrl = (url: string | undefined): string => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  return `${API_URL}${cleanUrl}`;
};

const getInitial = (name?: string): string => {
  if (!name || name.trim().length === 0) return "U";
  return name.trim().charAt(0).toUpperCase();
};

const timeAgo = (timestamp?: string): string => {
  if (!timestamp) return "Just now";
  const now = new Date();
  const date = new Date(timestamp);
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
};

export default function RescuerResponseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { startCall } = useCall();
  const { user } = useAuth();
  const { socket } = useSocket();

  const requestId = Array.isArray(params.requestId) ? params.requestId[0] : params.requestId;
  const caseId = Array.isArray(params.caseId) ? params.caseId[0] : params.caseId || requestId;

  const [loading, setLoading] = useState(true);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Progress update modal state
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [progressNote, setProgressNote] = useState("");
  const [submittingProgress, setSubmittingProgress] = useState(false);

  // Comments state
  const [comments, setComments] = useState<RescueComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Replies state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // Fetch full case & request details
  const fetchDetails = useCallback(async () => {
    if (!requestId) return;
    try {
      console.log("[RescuerResponse] Fetching details for request/case:", requestId);
      const token = await SecureStore.getItemAsync("authToken");
      
      const response = await axios.get(`${API_URL}/rescue/status/${requestId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = response.data as any;
      console.log("[RescuerResponse] Data loaded:", data);
      setCaseDetails(data);
    } catch (err: any) {
      console.error("[RescuerResponse] Error fetching details:", err);
      // Fallback: try fetching by caseId
      if (caseId && caseId !== requestId) {
        try {
          const res = await axios.get(`${API_URL}/strays/report/${caseId}`);
          setCaseDetails(res.data);
        } catch (e) {
          console.error("[RescuerResponse] Fallback fetch error:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [requestId, caseId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // ── Fetch Comments & Auto-Poll every 5 seconds ──────────────────────────────
  const loadCommentsList = useCallback(async () => {
    const targetId = caseId || requestId;
    if (!targetId) return;
    try {
      const data = await fetchComments(targetId);
      setComments(data);
    } catch (err) {
      console.warn("[RescuerResponse] Failed to load comments:", err);
    }
  }, [caseId, requestId]);

  useEffect(() => {
    void loadCommentsList();
    const interval = setInterval(() => {
      void loadCommentsList();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadCommentsList]);

  const handlePostComment = useCallback(async () => {
    const targetId = caseId || requestId;
    if (!newComment.trim() || !targetId) return;
    setSubmittingComment(true);
    try {
      const currentUserId = (user as any)?._id || (user as any)?.id || "rescuer";
      const currentUserName = (user as any)?.name || "Rescuer";
      const created = await postComment(targetId, newComment.trim(), currentUserName, currentUserId);
      setComments((prev) => [...prev, { ...created, replies: created.replies || [] }]);
      setNewComment("");
    } catch (err) {
      Alert.alert("Error", "Failed to post comment. Please try again.");
    } finally {
      setSubmittingComment(false);
    }
  }, [newComment, caseId, requestId, user]);

  const handlePostReply = useCallback(
    async (parentId: string) => {
      const targetId = caseId || requestId;
      if (!replyText.trim() || !targetId) return;
      setSubmittingReply(true);
      try {
        const currentUserId = (user as any)?._id || (user as any)?.id || "rescuer";
        const currentUserName = (user as any)?.name || "Rescuer";
        const created = await postReply(targetId, parentId, replyText.trim(), currentUserName, currentUserId);
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentId ? { ...c, replies: [...(c.replies || []), created] } : c
          )
        );
        setReplyText("");
        setReplyingTo(null);
      } catch (err) {
        Alert.alert("Error", "Failed to post reply. Please try again.");
      } finally {
        setSubmittingReply(false);
      }
    },
    [replyText, caseId, requestId, user]
  );

  // Join Socket.IO room for real-time updates
  useEffect(() => {
    if (!socket || !caseId) return;
    socket.emit("join_rescue", { caseId });
    return () => {
      socket.emit("leave_rescue", { caseId });
    };
  }, [socket, caseId]);

  // Listen for reporter cancellation on the /rescue namespace.
  // The backend emits "rescue_cancelled" to the room keyed by the request's _id
  // (which equals the requestId URL param for this screen).
  useEffect(() => {
    if (!requestId) return;

    const rescueSocket = ioClient(`${BASE_URL}/rescue`, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });

    rescueSocket.on("connect", () => {
      // Join the room for this specific request so we receive its events
      rescueSocket.emit("join_rescue", String(requestId));
    });

    rescueSocket.on("rescue_cancelled", () => {
      router.replace("/(tabs)/Home");
    });

    return () => {
      rescueSocket.disconnect();
    };
  }, [requestId, router]);

  // ── Action 1: In-App Voice Call reporter ────────────────────────────────────
  const handleInAppCall = () => {
    const reporterUserId = caseDetails?.reporter?.id || caseDetails?.userId || caseDetails?.reporterUserId;
    const reporterName = caseDetails?.reporter?.name || caseDetails?.reporterName || "Reporter";
    const reporterAvatar = caseDetails?.reporter?.avatar || caseDetails?.reporterAvatar || DEFAULT_AVATAR;

    if (!reporterUserId) {
      Alert.alert("Contact Error", "Reporter contact profile is not available for direct in-app calling.");
      return;
    }

    console.log(`[RescuerResponse] Initiating in-app voice call to reporter: ${reporterName} (${reporterUserId})`);
    startCall(reporterUserId, reporterName, reporterAvatar);
  };

  // ── Action 2: In-App Chat reporter ──────────────────────────────────────────
  const handleInAppChat = () => {
    const reporterUserId = caseDetails?.reporter?.id || caseDetails?.userId || caseDetails?.reporterUserId;
    if (reporterUserId) {
      router.push({
        pathname: "/chat/[id]",
        params: { id: reporterUserId },
      } as never);
    } else {
      router.push("/chat" as never);
    }
  };

  // ── Action 3: Navigate to Rescue Location (in-app full-screen map) ─────────
  const handleNavigateToLocation = () => {
    router.push({
      pathname: "/rescuer-navigation/[requestId]",
      params: { requestId: requestId as string },
    } as any);
  };

  // ── Action 4: Submit Rescue Progress Note ───────────────────────────────────
  const handleProgressSubmit = async () => {
    if (!progressNote.trim()) {
      Alert.alert("Required", "Please enter a progress note.");
      return;
    }

    setSubmittingProgress(true);
    try {
      const token = await SecureStore.getItemAsync("authToken");
      await axios.patch(
        `${API_URL}/rescue/request/${requestId}/details`,
        { summary: progressNote.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Progress Updated", "Rescue progress note saved.");
      setProgressModalVisible(false);
      setProgressNote("");
      fetchDetails();
    } catch (err: any) {
      console.error("[RescuerResponse] Progress update error:", err);
      Alert.alert("Error", err?.response?.data?.error || "Failed to update progress.");
    } finally {
      setSubmittingProgress(false);
    }
  };

  // ── Action 5: Mark Rescue as Completed ──────────────────────────────────────
  const handleCompleteRescue = async () => {
    Alert.alert(
      "Mark as Completed",
      "Are you sure you want to mark this rescue case as completed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Completed",
          onPress: async () => {
            setUpdatingStatus(true);
            try {
              const token = await SecureStore.getItemAsync("authToken");
              await axios.patch(
                `${API_URL}/rescue/request/${requestId}/details`,
                { summary: "Rescue case has been successfully concluded.", status: "Completed" },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              Alert.alert(
                "Rescue Completed! 🎉",
                "Thank you for saving an animal! The case has been marked as completed.",
                [
                  {
                    text: "Done",
                    onPress: () => router.replace("/(tabs)/Home"),
                  },
                ]
              );
            } catch (err: any) {
              console.error("[RescuerResponse] Complete error:", err);
              Alert.alert("Error", err?.response?.data?.error || "Failed to mark as completed.");
            } finally {
              setUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading response workflow...</Text>
      </View>
    );
  }

  const reporterName = caseDetails?.reporterName || caseDetails?.reporter?.name || "Reporter";
  const rawAvatar = caseDetails?.reporterAvatar || caseDetails?.reporter?.avatar || caseDetails?.reporter?.profileImage;
  const reporterAvatar = rawAvatar ? resolvePhotoUrl(rawAvatar) : DEFAULT_AVATAR;
  const animalType = caseDetails?.animalType || "Rescue Animal";
  const description = caseDetails?.description || caseDetails?.notes || "No notes provided.";
  const photos = caseDetails?.photos || [];
  const status = caseDetails?.status || "Under Rescue";
  const locationLat = caseDetails?.rescueLocation?.latitude || caseDetails?.location?.lat;
  const locationLng = caseDetails?.rescueLocation?.longitude || caseDetails?.location?.lng;
  const address = caseDetails?.rescueLocation?.address || caseDetails?.location?.address || "Location on map";
  const createdTime = caseDetails?.createdAt ? new Date(caseDetails.createdAt).toLocaleString() : "Recently";
  const timelineData = Array.isArray(caseDetails?.timeline) && caseDetails.timeline.length > 0
    ? caseDetails.timeline
    : [{ status: "Needs Help", message: "Your request was published on the network", timestamp: caseDetails?.createdAt || new Date().toISOString() }];

  const currentUserId = user ? String((user as any)._id || (user as any).id || "") : "";

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Response Processing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STATUS BANNER */}
        <View style={styles.statusBanner}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>🟠 {status.toUpperCase()}</Text>
          </View>
          <Text style={styles.statusBannerSubtext}>
            You have accepted this rescue case. Follow up with the reporter below.
          </Text>
        </View>

        {/* 👤 REPORTER DETAILS CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Reporter Information</Text>
          <View style={styles.reporterRow}>
            <Image source={{ uri: reporterAvatar }} style={styles.reporterAvatar} />
            <View style={styles.reporterInfo}>
              <Text style={styles.reporterName}>{reporterName}</Text>
              <Text style={styles.reporterRole}>Case Reporter</Text>
              <Text style={styles.reportedTime}>Reported: {createdTime}</Text>
            </View>
          </View>

          {/* IN-APP COMMUNICATION BUTTONS */}
          <View style={styles.communicationRow}>
            <TouchableOpacity style={styles.callButton} onPress={handleInAppCall}>
              <Text style={styles.commIcon}>📞</Text>
              <Text style={styles.callButtonText}>In-App Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.chatButton} onPress={handleInAppChat}>
              <Text style={styles.commIcon}>💬</Text>
              <Text style={styles.chatButtonText}>In-App Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🐾 ANIMAL & CASE DETAILS CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Case Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Case ID:</Text>
            <Text style={styles.infoValue}>{caseId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Animal Type:</Text>
            <Text style={styles.infoValue}>{animalType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description:</Text>
            <Text style={styles.infoValue}>{description}</Text>
          </View>

          {/* PHOTOS SCROLL */}
          {photos.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.infoLabel}>Photos ({photos.length}):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {photos.map((rawUri: string, idx: number) => {
                  const uri = resolvePhotoUrl(rawUri);
                  return (
                    <TouchableOpacity key={idx} activeOpacity={0.9}>
                      <Image source={{ uri }} style={styles.photoItem} resizeMode="cover" />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* 📍 LOCATION & NAVIGATION CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Rescue Location</Text>
          <Text style={styles.addressText}>📍 {address}</Text>

          {locationLat && locationLng && (
            <View style={styles.mapPreviewContainer}>
              <MapViewWrapper
                style={styles.mapPreview}
                initialRegion={{
                  latitude: locationLat,
                  longitude: locationLng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{ latitude: locationLat, longitude: locationLng }}
                  title="Rescue Location"
                  pinColor="orange"
                />
              </MapViewWrapper>
            </View>
          )}

          <TouchableOpacity style={styles.navigateButton} onPress={handleNavigateToLocation}>
            <Text style={styles.navigateButtonText}>🧭  Navigate to Location</Text>
          </TouchableOpacity>
        </View>

        {/* ⏱ TIMELINE TRACKER CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Rescue Timeline</Text>
          <View style={styles.timelineContainer}>
            {timelineData.map((step: any, index: number) => {
              const isLast = index === timelineData.length - 1;
              return (
                <View key={index} style={styles.timelineStep}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineIndicatorActive}>
                      <Text style={styles.timelineIcon}>✓</Text>
                    </View>
                    {!isLast && <View style={[styles.timelineLine, styles.timelineLineActive]} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStepTitleActive}>{step.status}</Text>
                    <Text style={styles.timelineStepSub}>{step.message || "Status updated"}</Text>
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

        {/* 📝 RESCUE ACTION BUTTONS */}
        {status === "Completed" ? (
          <View style={styles.actionSection}>
            <View style={{
              backgroundColor: "#D1FAE5",
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#A7F3D0",
            }}>
              <Text style={{ fontSize: 28, marginBottom: 6 }}>✅</Text>
              <Text style={{ fontSize: 16, fontFamily: typography.bold, color: "#047857", marginBottom: 4 }}>
                Rescue Completed
              </Text>
              <Text style={{ fontSize: 13, fontFamily: typography.medium, color: "#6B7280", textAlign: "center" }}>
                This case has been successfully concluded. No further updates can be made.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.actionSection}>
            <PrimaryButton
              title="📝  Custom Progress Note"
              onPress={() => setProgressModalVisible(true)}
              variant="outline"
            />

            <PrimaryButton
              title={updatingStatus ? "Updating..." : "✅  Mark Rescue as Completed"}
              onPress={handleCompleteRescue}
              disabled={updatingStatus}
            />
          </View>
        )}

        {/* 💬 REPORTER COMMENTS & CASE DISCUSSION CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>💬  Reporter Comments & Case Discussion</Text>
          
          {/* Comment Input Composition */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Type a message or note for reporter..."
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
              activeOpacity={0.85}
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

          {/* Empty State */}
          {comments.length === 0 ? (
            <Text style={styles.commentEmpty}>No reporter comments yet.</Text>
          ) : null}

          {/* Comments List */}
          {comments.map((comment) => (
            <View key={comment._id} style={{ marginTop: 12 }}>
              {/* Top Level Comment */}
              <View style={styles.commentBubble}>
                <View style={styles.commentBubbleHeader}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>
                      {getInitial(comment.userId === ((user as any)?._id || (user as any)?.id) ? "You" : comment.userName)}
                    </Text>
                  </View>
                  <Text style={styles.commentUserName}>
                    {comment.userId === ((user as any)?._id || (user as any)?.id) ? "You" : comment.userName}
                  </Text>
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
                      {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Replies List */}
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
                        <Text style={styles.commentUserName}>
                          {reply.userId === ((user as any)?._id || (user as any)?.id) ? "You" : reply.userName}
                        </Text>
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
      </ScrollView>

      {/* 📝 PROGRESS UPDATE MODAL */}
      <Modal visible={progressModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Rescue Progress</Text>
            <Text style={styles.modalSubtext}>
              Enter a note to update the reporter and timeline (e.g. "Arrived at location", "Animal secured").
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Type your update..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={progressNote}
              onChangeText={setProgressNote}
            />

            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setProgressModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, submittingProgress && { opacity: 0.6 }]}
                onPress={handleProgressSubmit}
                disabled={submittingProgress}
              >
                <Text style={styles.modalSubmitText}>
                  {submittingProgress ? "Saving..." : "Save Note"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  backIcon: {
    fontSize: 20,
    color: "#333",
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: "#333",
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  statusBanner: {
    backgroundColor: "#F5A62315",
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#F5A623",
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: "#F5A62333",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#F5A623",
  },
  statusBadgeText: {
    fontFamily: typography.bold,
    fontSize: 13,
    color: "#333",
  },
  statusBannerSubtext: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: "#333",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sectionHeader: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: "#333",
    marginBottom: spacing.sm,
  },
  reporterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  reporterAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f9f9f9",
    borderWidth: 2,
    borderColor: "#F5A623",
  },
  reporterInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  reporterName: {
    fontSize: 17,
    fontFamily: typography.bold,
    color: "#333",
  },
  reporterRole: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: "#6B7280",
  },
  communicationRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: spacing.sm,
    alignItems: "center",
  },
  callButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5A623",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#F5A623",
  },
  callButtonText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: "#000000",
  },
  chatButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#F5A623",
  },
  chatButtonText: {
    fontSize: 14,
    fontFamily: typography.semibold,
    color: "#000000",
  },
  commIcon: {
    fontSize: 16,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    fontFamily: typography.semibold,
    color: "#333",
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: typography.regular,
    color: "#333",
  },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 8,
  },
  addressText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: "#333",
    marginBottom: spacing.sm,
  },
  mapPreviewContainer: {
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  mapPreview: {
    flex: 1,
  },
  navigateButton: {
    backgroundColor: "#F5A62333",
    borderWidth: 1,
    borderColor: "#F5A623",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  navigateButtonText: {
    fontSize: 14,
    fontFamily: typography.semibold,
    color: "#333",
  },
  actionSection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  progressChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.xs,
  },
  progressChipBtn: {
    backgroundColor: "#F5A62333",
    borderWidth: 1,
    borderColor: "#F5A623",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  progressChipText: {
    fontSize: 14,
    fontFamily: typography.semibold,
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: "#333",
    marginBottom: 4,
  },
  modalSubtext: {
    fontSize: 13,
    fontFamily: typography.regular,
    color: "#6B7280",
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: spacing.md,
    fontSize: 14,
    fontFamily: typography.regular,
    color: "#333",
    textAlignVertical: "top",
    minHeight: 80,
    marginBottom: spacing.md,
  },
  modalButtonGroup: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: typography.semibold,
    color: "#333",
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: "#F5A623",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSubmitText: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: "#000000",
  },
  // ── Vertical Timeline Tracker ──
  timelineContainer: {
    paddingLeft: spacing.xs,
    marginTop: spacing.xs,
  },
  timelineStep: {
    flexDirection: "row",
    minHeight: 65,
  },
  timelineLeft: {
    alignItems: "center",
    width: 30,
    marginRight: spacing.sm,
  },
  timelineIndicatorActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    backgroundColor: "#F5A623",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: { shadowColor: "#F5A623", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  timelineIcon: {
    fontSize: 10,
    color: "#000000",
    fontFamily: typography.bold,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#eee",
    marginVertical: 4,
  },
  timelineLineActive: {
    backgroundColor: "#F5A623",
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  timelineStepTitleActive: {
    fontFamily: typography.semibold,
    fontSize: 14,
    color: "#92711B",
  },
  timelineStepSub: {
    fontFamily: typography.medium,
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  // ── Comments & Discussion Styles ──
  commentInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
    marginBottom: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    maxHeight: 100,
  },
  commentSendBtn: {
    backgroundColor: "#F5A623",
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  commentSendBtnDisabled: {
    backgroundColor: "#d9d9d9",
    opacity: 0.6,
  },
  commentSendIcon: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
  },
  commentEmpty: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    marginVertical: 12,
  },
  commentBubble: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  commentBubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F5A623",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  commentAvatarText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#000000",
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  commentTime: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  replyTrigger: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#F5A62333",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F5A623",
  },
  replyTriggerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000000",
  },
  commentCount: {
    fontSize: 11,
    color: "#6B7280",
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 8,
    gap: 8,
  },
  replyBubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  replyInputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
    marginLeft: 20,
    marginTop: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F5A623",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#333",
    maxHeight: 80,
  },
  replySendBtn: {
    backgroundColor: "#F5A623",
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: typography.medium,
    color: "#6B7280",
  },
  reportedTime: {
    fontSize: 12,
    fontFamily: typography.regular,
    color: "#9CA3AF",
    marginTop: 2,
  },
});

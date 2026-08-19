import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import axios from "axios";

import MapViewWrapper, { Marker } from "../../components/MapViewWrapper";
import PrimaryButton from "../../components/PrimaryButton";
import BackButton from "../../components/BackButton";
import { colors } from "../../constants/colors.constants";
import { spacing } from "../../constants/spacing.constants";
import { typography } from "../../constants/typography.constants";
import { API_URL, BASE_URL } from "../../constants/config.constants";
import { io as ioClient } from "socket.io-client";
import { useCall } from "../../contexts/CallContext";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import { fetchComments, postComment, postReply } from "../../services/rescueService";
import { useChatApi } from "../../hooks/useChatApi";
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
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const { createConversation } = useChatApi();

  const requestId = Array.isArray(params.requestId) ? params.requestId[0] : params.requestId;
  const caseId = Array.isArray(params.caseId) ? params.caseId[0] : params.caseId || requestId;

  const [loading, setLoading] = useState(true);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Progress update modal state
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [progressNote, setProgressNote] = useState("");
  const [submittingProgress, setSubmittingProgress] = useState(false);

  // Live location sharing state (Default: OFF)
  const [shareLiveLocation, setShareLiveLocation] = useState(false);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const rescueSocketRef = useRef<any>(null);

  // Fetch full case & request details
  const fetchDetails = useCallback(async () => {
    if (!requestId) return;
    try {
      console.log("[RescuerResponse] Fetching details for request/case:", requestId);
      const authToken = token || (await SecureStore.getItemAsync("authToken"));
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

      const response = await axios.get(`${API_URL}/rescue/status/${requestId}`, {
        headers,
      });

      const data = response.data as any;
      console.log("[RescuerResponse] Data loaded:", data);
      setCaseDetails(data);
    } catch (err: any) {
      console.error("[RescuerResponse] Error fetching details:", err);
      // Fallback: try fetching by caseId
      if (caseId && caseId !== requestId) {
        try {
          const authToken = token || (await SecureStore.getItemAsync("authToken"));
          const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
          const res = await axios.get(`${API_URL}/strays/report/${caseId}`, {
            headers,
          });
          setCaseDetails(res.data);
        } catch (e) {
          console.error("[RescuerResponse] Fallback fetch error:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [requestId, caseId, token]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Join Socket.IO room for real-time updates
  useEffect(() => {
    if (!socket || !caseId) return;
    socket.emit("join_rescue", { caseId });
    return () => {
      socket.emit("leave_rescue", { caseId });
    };
  }, [socket, caseId]);

  // Listen for reporter cancellation on the /rescue namespace & keep socket ref.
  useEffect(() => {
    if (!requestId) return;

    const rescueSocket = ioClient(`${BASE_URL}/rescue`, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });

    rescueSocketRef.current = rescueSocket;

    rescueSocket.on("connect", () => {
      rescueSocket.emit("join_rescue", String(requestId));
      if (caseId && caseId !== requestId) {
        rescueSocket.emit("join_rescue", String(caseId));
      }
    });

    rescueSocket.on("rescue_cancelled", () => {
      router.replace("/(tabs)/Home");
    });

    return () => {
      rescueSocket.disconnect();
      rescueSocketRef.current = null;
    };
  }, [requestId, caseId, router]);

  // Handle Share Live Location toggle ON / OFF
  const handleToggleLiveLocation = async (value: boolean) => {
    if (value) {
      try {
        const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
        if (permStatus !== "granted") {
          Alert.alert(
            "Permission Required",
            "Location permission is needed to share your live location with the reporter."
          );
          setShareLiveLocation(false);
          return;
        }

        setShareLiveLocation(true);

        // Emit current position immediately
        try {
          const initialLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (initialLoc?.coords) {
            const lat = initialLoc.coords.latitude;
            const lng = initialLoc.coords.longitude;
            const targetId = String(caseId || requestId);

            if (rescueSocketRef.current?.connected) {
              rescueSocketRef.current.emit("location_sharing_status", { rescueId: String(requestId), isSharing: true });
              rescueSocketRef.current.emit("location_update", { rescueId: String(requestId), lat, lng, isSharing: true });
              if (caseId && caseId !== requestId) {
                rescueSocketRef.current.emit("location_sharing_status", { rescueId: String(caseId), isSharing: true });
                rescueSocketRef.current.emit("location_update", { rescueId: String(caseId), lat, lng, isSharing: true });
              }
            }
            if (socket?.connected) {
              socket.emit("location_sharing_status", { caseId: targetId, rescueId: String(requestId), isSharing: true });
              socket.emit("location_update", {
                caseId: targetId,
                rescueId: String(requestId),
                location: { latitude: lat, longitude: lng },
                lat,
                lng,
                isSharing: true,
              });
            }
          }
        } catch (posErr) {
          console.warn("[RescuerResponse] Initial position fetch error:", posErr);
        }

        // Clean up any existing watcher before starting a new one
        if (locationSubRef.current) {
          locationSubRef.current.remove();
          locationSubRef.current = null;
        }

        // Start watching position and streaming live updates
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (loc) => {
            if (loc?.coords) {
              const lat = loc.coords.latitude;
              const lng = loc.coords.longitude;
              const targetId = String(caseId || requestId);

              if (rescueSocketRef.current?.connected) {
                rescueSocketRef.current.emit("location_update", { rescueId: String(requestId), lat, lng, isSharing: true });
                if (caseId && caseId !== requestId) {
                  rescueSocketRef.current.emit("location_update", { rescueId: String(caseId), lat, lng, isSharing: true });
                }
              }
              if (socket?.connected) {
                socket.emit("location_update", {
                  caseId: targetId,
                  rescueId: String(requestId),
                  location: { latitude: lat, longitude: lng },
                  lat,
                  lng,
                  isSharing: true,
                });
              }
            }
          }
        );

        locationSubRef.current = subscription;
      } catch (err) {
        console.error("[RescuerResponse] Error starting live location sharing:", err);
        Alert.alert("Location Error", "Unable to start live location sharing.");
        setShareLiveLocation(false);
      }
    } else {
      setShareLiveLocation(false);
      if (rescueSocketRef.current?.connected) {
        rescueSocketRef.current.emit("location_sharing_status", { rescueId: String(requestId), isSharing: false });
        rescueSocketRef.current.emit("location_update", { rescueId: String(requestId), isSharing: false });
        if (caseId && caseId !== requestId) {
          rescueSocketRef.current.emit("location_sharing_status", { rescueId: String(caseId), isSharing: false });
          rescueSocketRef.current.emit("location_update", { rescueId: String(caseId), isSharing: false });
        }
      }
      if (socket?.connected) {
        const targetId = String(caseId || requestId);
        socket.emit("location_sharing_status", { caseId: targetId, rescueId: String(requestId), isSharing: false });
        socket.emit("location_update", { caseId: targetId, rescueId: String(requestId), isSharing: false });
      }
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    }
  };

  // Cleanup location watcher on screen unmount
  useEffect(() => {
    return () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    };
  }, []);

  // ── Action 1: In-App Voice Call reporter ────────────────────────────────────
  const handleInAppCall = () => {
    const reporterUserId = caseDetails?.reporter?.id || caseDetails?.userId || caseDetails?.reporterUserId;

    if (!reporterUserId) {
      Alert.alert("Contact Error", "Reporter contact profile is not available for direct in-app calling.");
      return;
    }

    const isAnonymous = caseDetails?.reporterName === "Anonymous Reporter" || caseDetails?.anonymous;
    const caseMongoId = caseDetails?.rescueRequestId;
    let fullCaseId = caseDetails?.caseId || caseMongoId?.toString() || 'Anon';

    const reporterName = isAnonymous
      ? `Anonymous Reporter (${fullCaseId})`
      : (caseDetails?.reporter?.name || caseDetails?.reporterName || "Reporter");

    const reporterAvatar = isAnonymous
      ? "https://ui-avatars.com/api/?name=Anonymous+Reporter&background=FEB94B&color=fff"
      : (caseDetails?.reporter?.avatar || caseDetails?.reporterAvatar || DEFAULT_AVATAR);

    console.log(`[RescuerResponse] Initiating in-app voice call to reporter: ${reporterName} (${reporterUserId})`);
    startCall(reporterUserId, reporterName, reporterAvatar);
  };

  // ── Action 2: In-App Chat reporter ──────────────────────────────────────────
  const [startingChat, setStartingChat] = useState(false);
  const handleInAppChat = async () => {
    const reporterUserId = caseDetails?.reporter?.id || caseDetails?.userId || caseDetails?.reporterUserId;
    if (!reporterUserId) {
      Alert.alert("Contact Unavailable", "Reporter contact details are not available for chat.");
      return;
    }

    setStartingChat(true);
    try {
      const isAnonymous = caseDetails?.reporterName === "Anonymous Reporter" || caseDetails?.anonymous;
      const conversationType = isAnonymous ? "rescue" : "direct";
      const caseMongoId = caseDetails?.rescueRequestId;

      console.log(`[RescuerResponse] RAW caseId from backend: ${caseDetails?.caseId}`);

      const relatedEntity = isAnonymous && caseMongoId ? { kind: `StrayReport_${caseDetails?.caseId || ''}`, item: caseMongoId, referenceId: caseDetails?.caseId } : undefined;

      console.log(`[RescuerResponse] createConversation args -> userId: ${reporterUserId}, type: ${conversationType}, entity:`, relatedEntity);

      // Find or create a conversation with the reporter
      const conversation = (await createConversation(reporterUserId, conversationType, relatedEntity)) as any;

      const otherParticipant = conversation.participants?.find(
        (p: any) => p._id !== user?._id
      );

      let fullCaseId = caseDetails?.caseId || caseMongoId?.toString() || 'Anon';

      const reporterName = isAnonymous
        ? `Anonymous Reporter (${fullCaseId})`
        : (otherParticipant?.name || caseDetails?.reporter?.name || caseDetails?.reporterName || "Reporter");

      const reporterImage = isAnonymous
        ? "https://ui-avatars.com/api/?name=Anonymous+Reporter&background=FEB94B&color=fff"
        : (otherParticipant?.profileImage || caseDetails?.reporter?.avatar || caseDetails?.reporterAvatar || "");

      router.push({
        pathname: "/chat/[conversationId]",
        params: {
          conversationId: conversation._id,
          recipientName: reporterName,
          recipientId: reporterUserId,
          recipientImage: reporterImage,
        },
      } as any);
    } catch (error: any) {
      console.error("[RescuerResponse] Failed to start chat:", error);
      Alert.alert("Chat Error", error.message || "Could not open chat with reporter.");
    } finally {
      setStartingChat(false);
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
              if (locationSubRef.current) {
                locationSubRef.current.remove();
                locationSubRef.current = null;
              }
              setShareLiveLocation(false);
              const token = await SecureStore.getItemAsync("authToken");
              await axios.patch(
                `${API_URL}/rescue/request/${requestId}/details`,
                { summary: "Rescue case has been successfully concluded.", status: "Completed" },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              Alert.alert(
                "Rescue Completed",
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
  const isCaseCompleted = ["completed", "closed", "adopted"].includes((status || "").toLowerCase().trim());
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
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Response Processing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* STATUS BANNER */}
        <View style={styles.statusBanner}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{status.toUpperCase()}</Text>
          </View>
          <Text style={styles.statusBannerSubtext}>
            You have accepted this rescue case. Follow up with the reporter below.
          </Text>
        </View>

        {/* REPORTER DETAILS CARD */}
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
              <Ionicons name="call" size={16} color="#000000" />
              <Text style={styles.callButtonText}>In-App Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.chatButton, startingChat && { opacity: 0.6 }]} onPress={handleInAppChat} disabled={startingChat}>
              {startingChat ? (
                <ActivityIndicator size="small" color="#F5A623" />
              ) : (
                <Ionicons name="chatbubble-ellipses" size={16} color="#000000" />
              )}
              <Text style={styles.chatButtonText}>{startingChat ? "Opening..." : "In-App Chat"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ANIMAL & CASE DETAILS CARD */}
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

        {/* LOCATION & NAVIGATION CARD */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Rescue Location</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
            <Ionicons name="location-sharp" size={15} color="#F5A623" style={{ marginRight: 4 }} />
            <Text style={[styles.addressText, { marginBottom: 0 }]}>{address}</Text>
          </View>

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

          {/* SHARE LIVE LOCATION TOGGLE DIRECTLY BELOW THE MAP */}
          <View style={styles.liveLocationToggleRow}>
            <View style={styles.liveLocationToggleLeft}>
              <View style={[styles.liveLocationIconBox, shareLiveLocation && styles.liveLocationIconBoxActive]}>
                <Ionicons
                  name={shareLiveLocation ? "navigate" : "navigate-outline"}
                  size={18}
                  color={shareLiveLocation ? "#FFFFFF" : "#F5A623"}
                />
              </View>
              <View style={styles.liveLocationTextBox}>
                <Text style={styles.liveLocationTitle}>Share Live Location</Text>
                <Text style={styles.liveLocationSubtitle}>
                  {shareLiveLocation
                    ? "Sharing live location with reporter"
                    : "Share your live location with reporter"}
                </Text>
              </View>
            </View>
            <Switch
              value={shareLiveLocation}
              onValueChange={handleToggleLiveLocation}
              disabled={isCaseCompleted}
              trackColor={{ false: "#E5E7EB", true: "#F5C46B" }}
              thumbColor={shareLiveLocation ? "#F5A623" : "#FFFFFF"}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          <TouchableOpacity style={styles.navigateButton} onPress={handleNavigateToLocation}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="navigate-outline" size={16} color="#333" style={{ marginRight: 6 }} />
              <Text style={styles.navigateButtonText}>Navigate to Location</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* TIMELINE TRACKER CARD */}
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

        {/* RESCUE ACTION BUTTONS */}
        {isCaseCompleted ? (
          <View style={styles.actionSection}>
            <View style={{
              backgroundColor: "#D1FAE5",
              borderRadius: 14,
              padding: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#A7F3D0",
            }}>
              <Ionicons name="checkmark-circle" size={32} color="#10B981" style={{ marginBottom: 6 }} />
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
              title="Custom Progress Note"
              onPress={() => setProgressModalVisible(true)}
              variant="outline"
            />

            <PrimaryButton
              title={updatingStatus ? "Updating..." : "Mark Rescue as Completed"}
              onPress={handleCompleteRescue}
              disabled={updatingStatus}
            />
          </View>
        )}
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
  liveLocationToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: spacing.sm,
  },
  liveLocationToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  liveLocationIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5A62315",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  liveLocationIconBoxActive: {
    backgroundColor: "#F5A623",
  },
  liveLocationTextBox: {
    flex: 1,
  },
  liveLocationTitle: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: "#1F2937",
  },
  liveLocationSubtitle: {
    fontSize: 11,
    fontFamily: typography.regular,
    color: "#6B7280",
    marginTop: 1,
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

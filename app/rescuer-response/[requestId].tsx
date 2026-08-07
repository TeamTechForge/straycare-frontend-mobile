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
import { API_URL } from "../../constants/config.constants";
import { useCall } from "../../contexts/CallContext";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=200&h=200&fit=crop&q=80";

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

  // Join Socket.IO room for real-time updates
  useEffect(() => {
    if (!socket || !caseId) return;
    socket.emit("join_rescue", { caseId });
    return () => {
      socket.emit("leave_rescue", { caseId });
    };
  }, [socket, caseId]);

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

  // ── Action 3: Navigate to Rescue Location in GPS Maps app ─────────────────────
  const handleNavigateToLocation = () => {
    const lat = caseDetails?.rescueLocation?.latitude || caseDetails?.location?.lat;
    const lng = caseDetails?.rescueLocation?.longitude || caseDetails?.location?.lng;

    if (lat && lng) {
      const mapsUrl = Platform.select({
        ios: `maps:0,0?q=${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(Rescue Location)`,
      }) || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      Linking.openURL(mapsUrl).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      });
    } else {
      Alert.alert("Location Error", "Location coordinates not available.");
    }
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
              const targetCaseId = caseDetails?.caseId || caseId;

              await axios.patch(
                `${API_URL}/strays/report/${targetCaseId}/status`,
                { status: "Completed" },
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
              Alert.alert("Error", err?.response?.data?.message || "Failed to mark as completed.");
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
  const reporterAvatar = caseDetails?.reporterAvatar || caseDetails?.reporter?.avatar || DEFAULT_AVATAR;
  const animalType = caseDetails?.animalType || "Rescue Animal";
  const description = caseDetails?.description || caseDetails?.notes || "No notes provided.";
  const photos = caseDetails?.photos || [];
  const status = caseDetails?.status || "Under Rescue";
  const locationLat = caseDetails?.rescueLocation?.latitude || caseDetails?.location?.lat;
  const locationLng = caseDetails?.rescueLocation?.longitude || caseDetails?.location?.lng;
  const address = caseDetails?.rescueLocation?.address || caseDetails?.location?.address || "Location on map";
  const createdTime = caseDetails?.createdAt ? new Date(caseDetails.createdAt).toLocaleString() : "Recently";

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backPill} onPress={() => router.back()}>
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Response Processing</Text>
        <View style={{ width: 60 }} />
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
              <Text style={styles.infoLabel}>Photos:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {photos.map((uri: string, idx: number) => (
                  <Image key={idx} source={{ uri }} style={styles.photoItem} />
                ))}
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

        {/* 📝 RESCUE ACTION BUTTONS */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionHeader}>Quick Progress Updates</Text>
          <View style={styles.progressChipsWrap}>
            {[
              { label: "🚗  On the Way", note: "Rescuer is on the way to your location." },
              { label: "📍  Arrived", note: "Rescuer has arrived at the location." },
              { label: "🐶  Animal Located", note: "Animal has been located at the scene." },
              { label: "🩺  Animal Rescued", note: "Animal has been safely rescued and secured." },
              { label: "🚑  Transporting", note: "Transporting animal to veterinary care / shelter." },
            ].map((step, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.progressChipBtn}
                onPress={async () => {
                  setSubmittingProgress(true);
                  try {
                    const token = await SecureStore.getItemAsync("authToken");
                    await axios.patch(
                      `${API_URL}/rescue/request/${requestId}/details`,
                      { summary: step.note },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    Alert.alert("Progress Updated", `Status updated: ${step.label}`);
                    fetchDetails();
                  } catch (err: any) {
                    Alert.alert("Error", err?.response?.data?.error || "Failed to update progress.");
                  } finally {
                    setSubmittingProgress(false);
                  }
                }}
              >
                <Text style={styles.progressChipText}>{step.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

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
    backgroundColor: "#FAF9F6",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF9F6",
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 15,
    fontFamily: typography.medium,
    color: colors.text,
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
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 4,
  },
  backChevron: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111111",
  },
  backText: {
    fontSize: 11,
    fontFamily: typography.semibold,
    color: "#111111",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  statusBanner: {
    backgroundColor: "#FFF8EA",
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.3)",
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: "#FFE5B4",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  statusBadgeText: {
    fontFamily: typography.bold,
    fontSize: 13,
    color: "#B8860B",
  },
  statusBannerSubtext: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: "#4B5563",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionHeader: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: colors.text,
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
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  reporterInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  reporterName: {
    fontSize: 17,
    fontFamily: typography.bold,
    color: colors.text,
  },
  reporterRole: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: "#6B7280",
    marginTop: 2,
  },
  reportedTime: {
    fontSize: 11,
    fontFamily: typography.regular,
    color: "#9CA3AF",
    marginTop: 2,
  },
  communicationRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  callButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
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
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chatButtonText: {
    fontSize: 14,
    fontFamily: typography.semibold,
    color: "#111827",
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
    fontSize: 13,
    fontFamily: typography.semibold,
    color: "#6B7280",
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: typography.regular,
    color: colors.text,
  },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 8,
  },
  addressText: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: colors.text,
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
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  navigateButtonText: {
    fontSize: 14,
    fontFamily: typography.semibold,
    color: "#1D4ED8",
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
    backgroundColor: "#FFF8EA",
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.4)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  progressChipText: {
    fontSize: 12,
    fontFamily: typography.semibold,
    color: "#B8860B",
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
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtext: {
    fontSize: 13,
    fontFamily: typography.regular,
    color: "#6B7280",
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: spacing.md,
    fontSize: 14,
    fontFamily: typography.regular,
    color: colors.text,
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
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: typography.semibold,
    color: "#4B5563",
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSubmitText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: "#000000",
  },
});

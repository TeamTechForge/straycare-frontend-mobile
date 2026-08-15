
// request-status/index.tsx
//
// This screen:
//   1. Sends a rescue request to the backend  (POST /api/rescue/send-request)
//   2. Polls for status updates every 3 s     (GET  /api/rescue/status/:id)
//   3. Lets the user cancel mid-flight:
//        - Aborts any in-flight fetch via AbortController (axios v1 supports `signal`)
//        - Clears the polling interval immediately
//        - Aborts any in-flight poll GET request
//        - Shows "Sending request is stopping…" feedback
//        - Resets all UI state so the user can try again
//
// ── Cancellation design ────────────────────────────────────────────────────────
// • Three separate AbortControllers:
//     1. `sendAbortRef`  — for the initial POST /send-request
//     2. `pollAbortRef`  — for each individual GET /status/:id poll tick
//     3. (timers)        — `pollRef` interval, `cancelTimerRef` banner timeout
// • `cancelledRef` is a synchronous boolean that async code checks after every
//   await to bail out if the user cancelled while the request was in flight.
// • `stopEverything()` aborts all network + clears all timers in one call.
// • Works even on slow networks or long backend delays because
//   AbortController.abort() tears down the underlying TCP socket immediately.

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import axios from "axios"; // axios v1 — uses AbortController, NOT CancelToken
import { useCall } from "../../contexts/CallContext";

// Shared API response types
import type {
  Rescuer,
  RescueStatus,
  SendRequestResponse,
  RescueStatusResponse,
} from "../../types/Api";

// ─── Design tokens ─────────────────────────────────────────────────────────────
import { colors } from "../../constants/colors.constants";
import { spacing } from "../../constants/spacing.constants";
import { typography } from "../../constants/typography.constants";

// ─── API base URL ──────────────────────────────────────────────────────────────
import { BASE_URL } from "../../constants/config.constants";

const API_BASE_URL = BASE_URL;

// ─── Navigation params ─────────────────────────────────────────────────────────
type RequestStatusParams = {
  rescuerId?: string | string[];
  caseId?: string | string[];
  animalType?: string | string[];
  animalPhoto?: string | string[];
  description?: string | string[];
  excludeIds?: string | string[];
  lat?: string | string[];
  lng?: string | string[];
  requestId?: string | string[];
};

// Helper: always unwrap Expo Router's possible array param to a single string
const getFirstParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

// ─── Helper: check if an axios error was caused by an AbortController signal ──
// axios v1 sets error.name === "CanceledError" when the request is aborted.
// Native fetch sets "AbortError". We check both for future-proofing.
const isAbortError = (err: unknown): boolean => {
  if (err instanceof Error) {
    return (
      err.name === "CanceledError" ||   // axios v1 abort
      err.name === "AbortError"         // native fetch abort (future-proof)
    );
  }
  return false;
};

// ─── Status color mapping ──────────────────────────────────────────────────────
const STATUS_THEME = {
  pending:   { bg: "#FFF7E6", text: "#B8860B", label: "Pending" },
  accepted:  { bg: "#E8F5E9", text: "#1B5E20", label: "Accepted" },
  rejected:  { bg: "#FFEBEE", text: "#C62828", label: "Rejected" },
  completed: { bg: "#E8F5E9", text: "#1B5E20", label: "Completed" },
} as const;

// ─── Timeline step definitions ─────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { key: "sent",     label: "Request Sent" },
  { key: "notified", label: "Rescuer Notified" },
  { key: "response", label: "Response Received" },
] as const;

// ─── Component ─────────────────────────────────────────────────────────────────
export default function RequestStatusScreen() {
  const params = useLocalSearchParams<RequestStatusParams>();
  const { rescuerId, caseId, animalType, animalPhoto, description, excludeIds, lat, lng, requestId: paramRequestId } = params;
  const rescuerIdValue = getFirstParam(rescuerId) ?? "";
  const initialRequestId = getFirstParam(paramRequestId) ?? null;
  const { startCall } = useCall();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [status,     setStatus]     = useState<RescueStatus>("pending");
  const [rescuer,    setRescuer]    = useState<Rescuer | null>(null);
  const [loading,    setLoading]    = useState<boolean>(!initialRequestId);  // skip POST if initialRequestId exists
  const [requestId,  setRequestId]  = useState<string | null>(initialRequestId);

  // Keep requestIdRef in sync with the state value
  useEffect(() => { requestIdRef.current = requestId; }, [requestId]);
  const [cancelled,  setCancelled]  = useState<boolean>(false); // true after user cancels
  const [cancelling, setCancelling] = useState<boolean>(false); // true during the brief "stopping" phase

  // ── Refs ──────────────────────────────────────────────────────────────────
  // Polling interval handle
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // AbortController for the send-request POST call.
  // Stored in a ref so handleCancel() can call .abort() from outside the effect.
  const sendAbortRef = useRef<AbortController | null>(null);

  // AbortController for each individual poll GET call.
  // Replaced on every tick so we can abort whichever poll is currently in flight.
  const pollAbortRef = useRef<AbortController | null>(null);

  // Stable flag so async callbacks can check cancellation without stale closures.
  const cancelledRef = useRef<boolean>(false);

  // Tracks whether the component is still mounted — prevents setState after unmount.
  const mountedRef = useRef<boolean>(true);

  // Holds the "stopping" banner timeout so we can clear it on unmount.
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mirror of `requestId` state kept in a ref so handleCancel() always reads
  // the latest value without needing it in the useCallback dependency array.
  const requestIdRef = useRef<string | null>(initialRequestId);

  // ─── Unmount cleanup ──────────────────────────────────────────────────────
  // Abort all in-flight requests and clear all timers when the component unmounts.
  // This prevents memory leaks, orphaned network requests, and setState-after-unmount.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Abort in-flight POST
      if (sendAbortRef.current) {
        sendAbortRef.current.abort();
        sendAbortRef.current = null;
      }
      // Abort in-flight poll GET
      if (pollAbortRef.current) {
        pollAbortRef.current.abort();
        pollAbortRef.current = null;
      }
      // Clear polling interval
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      // Clear cancellation banner timer
      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current);
        cancelTimerRef.current = null;
      }
    };
  }, []);

  // ─── stopEverything: abort network + stop timers ───────────────────────────
  // Called by handleCancel() and by unmount cleanup.
  const stopEverything = useCallback(() => {
    // 1. Abort the in-flight send-request POST (no-op if already finished)
    if (sendAbortRef.current) {
      sendAbortRef.current.abort();
      sendAbortRef.current = null;
    }
    // 2. Abort the in-flight poll GET (no-op if not currently mid-request)
    if (pollAbortRef.current) {
      pollAbortRef.current.abort();
      pollAbortRef.current = null;
    }
    // 3. Clear the polling interval so no more ticks fire
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ─── Cancel button handler ────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    // Step 1: Set the cancellation flag synchronously.
    //         Any in-flight async code that resumes after the abort will
    //         check this flag and bail out immediately.
    cancelledRef.current = true;

    // Step 2: Show the "Sending request is stopping…" banner.
    setCancelling(true);

    // Step 3: Abort ALL network requests and clear ALL timers immediately.
    //         This works even on slow networks because AbortController.abort()
    //         tears down the underlying TCP socket.
    stopEverything();

    // Step 4: If a request was already created on the backend, cancel it so the
    //         rescuer's DB record is marked "cancelled" immediately. This is
    //         fire-and-forget — we don't wait for the response to update the UI.
    const activeRequestId = requestIdRef.current;
    if (activeRequestId) {
      axios
        .patch(`${API_BASE_URL}/api/rescue/request/${activeRequestId}/cancel`)
        .catch((err: unknown) => {
          console.warn("[RequestStatus] Background cancel PATCH failed:", err);
        });
    }

    // Step 5: After a brief moment (800 ms), switch to the "cancelled" UI
    //         so the user can see the stopping message before the final state.
    cancelTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return; // guard against unmount during timeout
      setCancelling(false);
      setCancelled(true);
      setLoading(false);
      setStatus("pending");  // reset so a future retry starts fresh
      setRescuer(null);
      setRequestId(null);
      requestIdRef.current = null;
    }, 800); // short enough to feel responsive, long enough to see the message
  }, [stopEverything]);

  // ─── Retry handler ────────────────────────────────────────────────────────
  // Resets ALL cancellation and request state, then re-triggers the send effect.
  // The user stays on this screen — no navigation needed.
  const handleRetry = useCallback(() => {
    // Reset cancellation flag FIRST so the effect guard passes
    cancelledRef.current = false;
    setCancelled(false);
    setCancelling(false);
    setStatus("pending");
    setRescuer(null);
    setRequestId(null);
    setLoading(true); // triggers the sendRequest effect to re-run
  }, []);

  // ─── Step 1: Send the rescue request ──────────────────────────────────────
  // Runs on mount and again whenever the user presses "Go Back & Retry"
  // (loading goes back to true). The effect only fires when loading is true
  // and cancellation is not active.
  useEffect(() => {
    // Guard: don't start if already cancelled or loading is false
    if (cancelledRef.current || !loading) return;

    const sendRequest = async (): Promise<void> => {
      if (!rescuerIdValue) {
        console.log("[RequestStatus] No rescuerId — marking as rejected.");
        if (mountedRef.current) {
          setStatus("rejected");
          setLoading(false);
        }
        return;
      }

      // Create a new AbortController for this POST.
      // Keeping it in the ref lets handleCancel() abort it from outside.
      const controller = new AbortController();
      sendAbortRef.current = controller;

      try {
        console.log("[RequestStatus] POST", `${API_BASE_URL}/api/rescue/send-request`);
        console.log("[RequestStatus] rescuerId:", rescuerIdValue);

        // axios v1 accepts `signal` from AbortController natively.
        // The request is cancelled the instant controller.abort() is called —
        // even on a slow network or long backend delay.
        const response = await axios.post<SendRequestResponse>(
          `${API_BASE_URL}/api/rescue/send-request`,
          {
            rescuerId: rescuerIdValue,
            caseId: getFirstParam(caseId) ?? "",
            animalType: getFirstParam(animalType) ?? "Dog",
            description: getFirstParam(description) ?? "",
            photos: getFirstParam(animalPhoto) ? [getFirstParam(animalPhoto)] : [],
          },
          { signal: controller.signal } as any // ← AbortController signal
        );

        // If the user cancelled while we were awaiting, discard the result.
        // This check is necessary because the response may arrive just before
        // the abort fires on a fast network.
        if (cancelledRef.current) return;

        const data: SendRequestResponse = response.data;
        console.log("[RequestStatus] Response:", data);

        if (mountedRef.current) {
          setStatus(data.status ?? "pending");
          setRescuer(data.rescuer ?? null);
          setRequestId(data.requestId ?? null);
        }
      } catch (error: unknown) {
        // isAbortError() returns true when we called controller.abort() —
        // this is intentional, not an error, so we skip UI updates.
        if (isAbortError(error)) {
          console.log("[RequestStatus] Send-request aborted by user.");
          return;
        }

        // Real network / server error
        console.error("[RequestStatus] Error sending request:", error);
        if (!cancelledRef.current && mountedRef.current) {
          setStatus("rejected");
          setRescuer(null);
        }
      } finally {
        sendAbortRef.current = null; // clear the ref — this controller is done
        if (!cancelledRef.current && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    void sendRequest();

    // Cleanup: abort the POST if the effect re-runs or the component unmounts
    return () => {
      if (sendAbortRef.current) {
        sendAbortRef.current.abort();
        sendAbortRef.current = null;
      }
    };
  }, [rescuerIdValue, loading]); // `loading` dependency enables retry

  // ─── Step 2: Poll for status updates ──────────────────────────────────────
  // Starts once we have a requestId and status is still "pending".
  // Stops when status resolves, when the user cancels, or when unmounting.
  useEffect(() => {
    if (!requestId || status !== "pending" || cancelledRef.current) return;

    console.log("[RequestStatus] Starting status polling for:", requestId);

    pollRef.current = setInterval(() => {
      // Guard at the top of every tick — if the user cancelled between ticks,
      // stop the interval and don't fire another GET request.
      if (cancelledRef.current) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        return;
      }

      // Fresh AbortController for this individual GET request.
      // If handleCancel() fires mid-request, it will call pollAbortRef.current.abort()
      // to terminate this specific request immediately.
      const controller = new AbortController();
      pollAbortRef.current = controller;

      axios
        .get<RescueStatusResponse>(
          `${API_BASE_URL}/api/rescue/status/${requestId}`,
          { signal: controller.signal } as any // ← AbortController signal
        )
        .then((res) => {
          pollAbortRef.current = null;

          if (cancelledRef.current || !mountedRef.current) return; // cancelled or unmounted while awaiting

          const responseData: RescueStatusResponse = res.data;
          const newStatus: RescueStatus = responseData.status;

          console.log("[RequestStatus] Poll result:", newStatus);

          // Always update rescuer details if returned
          if (responseData.rescuer) {
            setRescuer(responseData.rescuer);
          }

          if (newStatus !== "pending") {
            if (newStatus === "rejected") {
              if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }

              // Automatically find the next nearest rescuer
              let currentExclude = [];
              try {
                const rawExclude = getFirstParam(excludeIds);
                if (rawExclude) currentExclude = JSON.parse(rawExclude);
              } catch (e) {
                console.error("[RequestStatus] Failed to parse excludeIds:", e);
              }

              const updatedExclude = [...currentExclude, rescuerIdValue];

              Alert.alert(
                "Rescuer Unavailable",
                "The matched rescuer was unable to accept. Searching for the next nearest rescuer...",
                [{ text: "OK" }]
              );

              router.replace({
                pathname: "/searching-help",
                params: {
                  lat: getFirstParam(lat) ?? "",
                  lng: getFirstParam(lng) ?? "",
                  caseId: getFirstParam(caseId) ?? "",
                  animalType: getFirstParam(animalType) ?? "",
                  animalPhoto: getFirstParam(animalPhoto) ?? "",
                  description: getFirstParam(description) ?? "",
                  excludeIds: JSON.stringify(updatedExclude),
                },
              } as any);
              return;
            }

            setStatus(newStatus);
            // Status resolved — stop polling
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
          }
        })
        .catch((err: unknown) => {
          pollAbortRef.current = null;
          if (isAbortError(err)) {
            console.log("[RequestStatus] Poll request aborted by user.");
            return; // expected — user cancelled, do nothing
          }
          console.error("[RequestStatus] Polling error:", err);
        });
    }, 3000);

    // Cleanup: clear the interval AND abort any in-flight poll if the
    // component unmounts or this effect re-runs.
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      // Also abort any in-flight poll GET — prevents orphaned requests
      if (pollAbortRef.current) {
        pollAbortRef.current.abort();
        pollAbortRef.current = null;
      }
    };
  }, [requestId, status]);

  // ─── Derived: should the cancel button be visible? ────────────────────────
  // Only while a request is in progress (loading or pending polling).
  // Hidden once the request is resolved, cancelled, or during the stopping phase.
  const showCancelButton =
    !cancelled &&
    !cancelling &&
    (loading || status === "pending");

  // ─── Derived: timeline progress ───────────────────────────────────────────
  // Determines how many of the 3 timeline steps are "completed"
  const getTimelineProgress = (): number => {
    if (loading) return 0;                                    // Still sending
    if (status === "pending" && requestId) return 1;          // Sent, waiting
    if (status === "accepted" || status === "completed") return 3; // Fully resolved
    if (status === "rejected") return 2;                      // Got a response
    return 0;
  };
  const timelineProgress = getTimelineProgress();

  // ─── Derived: status image source ─────────────────────────────────────────
  const getStatusImage = () => {
    if (status === "pending")  return require("../../assets/images/pending.gif");
    if (status === "accepted" || status === "completed") return require("../../assets/images/accepted.jpg");
    if (status === "rejected") return require("../../assets/images/rejected.jpg");
    return require("../../assets/images/pending.gif");
  };

  // ─── Derived: status headline text ────────────────────────────────────────
  const getStatusTitle = (): string => {
    if (status === "pending")   return "Waiting for Rescuer Response…";
    if (status === "accepted")  return "Request Accepted!";
    if (status === "rejected")  return "Request Rejected";
    if (status === "completed") return "Rescue Completed!";
    return "Processing…";
  };

  // ─── Derived: status subtitle text ────────────────────────────────────────
  const getStatusSubtitle = (): string => {
    if (status === "pending")   return "Your request has been sent. The rescuer will respond shortly.";
    if (status === "accepted")  return "A rescuer is on the way to help. Hang tight!";
    if (status === "rejected")  return "The rescuer was unable to accept. Please try another.";
    if (status === "completed") return "The rescue operation has been completed successfully.";
    return "";
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── "Stopping…" banner — shown briefly after Cancel is pressed ───── */}
        {cancelling && (
          <View style={styles.cancellingBanner}>
            <ActivityIndicator size="small" color={colors.white} style={{ marginRight: spacing.sm }} />
            <Text style={styles.cancellingText}>Sending request is stopping…</Text>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ── LOADING STATE: sending the initial request ────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {loading && !cancelling ? (
          <View style={styles.loadingContainer}>
            {/* Header */}
            <Text style={styles.screenTitle}>Request Status</Text>
            <Text style={styles.screenSubtitle}>Connecting you with a rescuer</Text>

            {/* Loading card */}
            <View style={styles.statusCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingTitle}>Sending rescue request…</Text>
              <Text style={styles.loadingSubtitle}>
                Please wait while we contact the rescuer.
              </Text>
            </View>
          </View>
        ) : cancelled ? (
          /* ════════════════════════════════════════════════════════════════ */
          /* ── CANCELLED STATE ──────────────────────────────────────────── */
          /* ════════════════════════════════════════════════════════════════ */
          <View style={styles.centeredContent}>
            {/* Header */}
            <Text style={styles.screenTitle}>Request Cancelled</Text>
            <Text style={styles.screenSubtitle}>Your rescue request was stopped</Text>

            {/* Cancelled card */}
            <View style={styles.statusCard}>
              <Image
                source={require("../../assets/images/rejected.jpg")}
                style={styles.statusImage}
              />
              <Text style={[styles.statusCardTitle, { color: "#C62828" }]}>
                Request Cancelled
              </Text>
              <Text style={styles.statusCardSubtitle}>
                The request was stopped before it could be sent.{"\n"}
                You can try again or go back.
              </Text>
            </View>
          </View>
        ) : (
          /* ════════════════════════════════════════════════════════════════ */
          /* ── ACTIVE / RESOLVED STATE ──────────────────────────────────── */
          /* ════════════════════════════════════════════════════════════════ */
          <View style={styles.centeredContent}>

            {/* ── Header section ─────────────────────────────────────────── */}
            <Text style={styles.screenTitle}>Request Status</Text>
            <Text style={styles.screenSubtitle}>Track your rescue request progress</Text>

            {/* ── Timeline / Progress indicator ──────────────────────────── */}
            {/* 3 circles connected by lines showing: Sent → Notified → Response */}
            <View style={styles.timelineContainer}>
              {TIMELINE_STEPS.map((step, index) => {
                const isCompleted = index < timelineProgress;
                const isActive = index === timelineProgress;
                return (
                  <View key={step.key} style={styles.timelineStepWrapper}>
                    {/* Connector line (not for the first step) */}
                    {index > 0 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: index <= timelineProgress - 1 ? colors.primary : "#E5E7EB" },
                        ]}
                      />
                    )}
                    {/* Circle */}
                    <View
                      style={[
                        styles.timelineCircle,
                        isCompleted && styles.timelineCircleCompleted,
                        isActive && styles.timelineCircleActive,
                      ]}
                    >
                      {isCompleted ? (
                        <Text style={styles.timelineCheckmark}>✓</Text>
                      ) : (
                        <Text
                          style={[
                            styles.timelineNumber,
                            (isActive || isCompleted) && { color: colors.white },
                          ]}
                        >
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    {/* Step label */}
                    <Text
                      style={[
                        styles.timelineLabel,
                        (isCompleted || isActive) && styles.timelineLabelActive,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* ── Status Card ────────────────────────────────────────────── */}
            {/* Premium elevated card showing the current request status */}
            <View style={styles.statusCard}>
              {/* Status image */}
              <Image source={getStatusImage()} style={styles.statusImage} />

              {/* Status badge */}
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_THEME[status].bg },
                ]}
              >
                <View
                  style={[
                    styles.statusBadgeDot,
                    { backgroundColor: STATUS_THEME[status].text },
                  ]}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: STATUS_THEME[status].text },
                  ]}
                >
                  {STATUS_THEME[status].label}
                </Text>
              </View>

              {/* Status title and subtitle */}
              <Text style={styles.statusCardTitle}>{getStatusTitle()}</Text>
              <Text style={styles.statusCardSubtitle}>{getStatusSubtitle()}</Text>
            </View>

            {/* ── Rescuer Card ───────────────────────────────────────────── */}
            {/* Shown when a rescuer is assigned to this request */}
            {rescuer !== null && (
              <View style={styles.rescuerCard}>
                {/* Section label */}
                <Text style={styles.sectionLabel}>Assigned Rescuer</Text>

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  {rescuer.avatar ? (
                    <Image source={{ uri: rescuer.avatar }} style={styles.avatar} />
                  ) : (
                    <Image
                      source={require("../../assets/images/default-avatar.jpg")}
                      style={styles.avatar}
                    />
                  )}
                </View>

                {/* Name */}
                <Text style={styles.rescuerName}>{rescuer.name}</Text>

                {/* Role label */}
                <Text style={styles.rescuerRole}>Rescuer</Text>

                {/* Phone button — only shown when accepted */}
                {status === "accepted" && rescuer.phone ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (!rescuer.userId && !rescuer._id) {
                        Alert.alert("Contact Unavailable", "Contact details are not available.");
                        return;
                      }
                      startCall(String(rescuer.userId || rescuer._id), rescuer.name, rescuer.avatar);
                    }}
                    activeOpacity={0.7}
                    style={styles.phoneButton}
                  >
                    <Text style={styles.phoneIcon}>📞</Text>
                    <Text style={styles.phoneText}>{rescuer.phone}</Text>
                  </TouchableOpacity>
                ) : null}

                {/* ETA badge — shown when accepted */}
                {status === "accepted" && (
                  <View style={styles.etaBadge}>
                    <Text style={styles.etaIcon}>🕐</Text>
                    <Text style={styles.etaText}>ETA: ~10 min</Text>
                  </View>
                )}
              </View>
            )}

            {/* ── Rescue Case Card ───────────────────────────────────────── */}
            {/* Shown when the rescuer has accepted the request */}
            {status === "accepted" && (
              <View style={styles.caseCard}>
                {/* Left accent border is achieved via borderLeftWidth */}
                <Text style={styles.caseTitle}>Rescue Case</Text>
                <View style={styles.caseDivider} />
                <View style={styles.caseRow}>
                  <Text style={styles.caseLabel}>Animal</Text>
                  <Text style={styles.caseValue}>Injured Dog</Text>
                </View>
                <View style={styles.caseRow}>
                  <Text style={styles.caseLabel}>Location</Text>
                  <Text style={styles.caseValue}>Near Main Street</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ── Bottom action buttons ─────────────────────────────────────── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <View style={styles.buttonContainer}>
          {cancelled ? (
            <>
              {/* Try Again: resets all state and re-sends the request */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleRetry}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              {/* Go Back: navigates to the previous screen */}
              <TouchableOpacity
                style={styles.outlineButton}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Text style={styles.outlineButtonText}>Go Back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Cancel: aborts the request and stops all timers */}
              {showCancelButton && (
                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <Text style={styles.outlineButtonText}>Cancel</Text>
                </TouchableOpacity>
              )}

              {/* Done: only enabled once the request is resolved */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  status === "pending" && styles.primaryButtonDisabled,
                ]}
                onPress={() => router.push("/")}
                disabled={status === "pending"}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const CARD_RADIUS = 20;
const BUTTON_RADIUS = 14;

const styles = StyleSheet.create({
  // ── Layout ────────────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl + spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
  },
  centeredContent: {
    flex: 1,
    alignItems: "center",
  },

  // ── Header ────────────────────────────────────────────────────────────────
  screenTitle: {
    fontSize: typography.title,
    fontFamily: typography.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  screenSubtitle: {
    fontSize: typography.body,
    fontFamily: typography.regular,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: spacing.xl,
  },

  // ── Cancelling banner ─────────────────────────────────────────────────────
  cancellingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: CARD_RADIUS / 2,
    marginBottom: spacing.lg,
  },
  cancellingText: {
    color: colors.white,
    fontSize: typography.body + 2, // 16px
    fontFamily: typography.semibold,
  },

  // ── Timeline / Progress indicator ─────────────────────────────────────────
  timelineContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  timelineStepWrapper: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    top: 18,  // Vertically centered on the circle (36/2)
    right: "50%",
    left: "-50%",
    height: 3,
    backgroundColor: "#E5E7EB",
    zIndex: 0,
  },
  timelineCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    marginBottom: spacing.xs,
  },
  timelineCircleCompleted: {
    backgroundColor: colors.primary,
  },
  timelineCircleActive: {
    backgroundColor: colors.primary,
    // Glow effect for active step
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  timelineCheckmark: {
    color: colors.white,
    fontSize: 16,
    fontFamily: typography.bold,
  },
  timelineNumber: {
    color: "#9CA3AF",
    fontSize: typography.body,
    fontFamily: typography.semibold,
  },
  timelineLabel: {
    fontSize: typography.small,
    fontFamily: typography.regular,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: spacing.xs / 2,
  },
  timelineLabelActive: {
    color: colors.text,
    fontFamily: typography.semibold,
  },

  // ── Status Card (premium elevated card) ───────────────────────────────────
  statusCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: CARD_RADIUS,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
    // Elevated shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  statusImage: {
    width: 100,
    height: 100,
    borderRadius: spacing.sm,
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 100,
    marginBottom: spacing.md,
  },
  statusBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusBadgeText: {
    fontSize: typography.small,
    fontFamily: typography.semibold,
  },
  statusCardTitle: {
    fontSize: typography.section,
    fontFamily: typography.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  statusCardSubtitle: {
    fontSize: typography.body,
    fontFamily: typography.regular,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Loading state (inside status card) ────────────────────────────────────
  loadingTitle: {
    fontSize: typography.section,
    fontFamily: typography.bold,
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  loadingSubtitle: {
    fontSize: typography.body,
    fontFamily: typography.regular,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Rescuer Card ──────────────────────────────────────────────────────────
  rescuerCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: CARD_RADIUS,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
    // Elevated shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sectionLabel: {
    fontSize: typography.small,
    fontFamily: typography.semibold,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 88, // 80 + 4*2 border
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    // Subtle glow behind avatar
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E5E7EB",
  },
  rescuerName: {
    fontSize: 20,
    fontFamily: typography.bold,
    color: colors.text,
    marginBottom: 2,
  },
  rescuerRole: {
    fontSize: typography.body,
    fontFamily: typography.medium,
    color: "#9CA3AF",
    marginBottom: spacing.md,
  },
  phoneButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: BUTTON_RADIUS,
    marginBottom: spacing.sm,
  },
  phoneIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  phoneText: {
    fontSize: typography.body,
    fontFamily: typography.bold,
    color: colors.white,
  },
  etaBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: "#FFF7E6",
    borderRadius: 100,
    marginTop: spacing.xs,
  },
  etaIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  etaText: {
    fontSize: typography.body,
    fontFamily: typography.semibold,
    color: "#B8860B",
  },

  // ── Rescue Case Card ──────────────────────────────────────────────────────
  caseCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: CARD_RADIUS,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    // Left accent border
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    // Elevated shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  caseTitle: {
    fontSize: typography.section,
    fontFamily: typography.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  caseDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: spacing.md,
  },
  caseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  caseLabel: {
    fontSize: typography.body,
    fontFamily: typography.medium,
    color: "#6B7280",
  },
  caseValue: {
    fontSize: typography.body,
    fontFamily: typography.semibold,
    color: colors.text,
  },

  // ── Bottom action buttons ─────────────────────────────────────────────────
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  primaryButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: BUTTON_RADIUS,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: typography.body + 2, // 16px
    fontFamily: typography.bold,
    color: colors.white,
  },
  outlineButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: "transparent",
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1.5,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    fontSize: typography.body + 2, // 16px
    fontFamily: typography.bold,
    color: "#6B7280",
  },
});

// searching-help/index.tsx
//
// This screen appears while the app searches for a nearby rescuer.
// It calls POST /api/rescue/find-nearest with the user's GPS coordinates.
// On success it navigates to /rescuer-found automatically.
//
// ── Cancellation design ────────────────────────────────────────────────────────
// • An AbortController is wired to the axios POST via the `signal` option.
// • When Cancel is pressed:
//     1. `cancelledRef` is set synchronously so any in-flight async code bails.
//     2. `controller.abort()` fires immediately — tears down the TCP socket
//        even on slow networks or long backend delays.
//     3. A "Sending request is stopping…" banner appears for ~800 ms.
//     4. The UI resets to the "cancelled" state with a Try Again button.
// • On unmount the controller is also aborted (cleanup return in useEffect).

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import axios from "axios"; // axios v1 — uses AbortController, NOT CancelToken

import type { FindNearestResponse } from "../../types/api";

// ─── URL params ────────────────────────────────────────────────────────────────
type SearchParams = {
  lat?: string | string[];
  lng?: string | string[];
};

// ─── API base URL ──────────────────────────────────────────────────────────────
const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (envUrl) return envUrl;
  if (Platform.OS === "android") return "http://10.0.2.2:5000"; // Android emulator
  return "http://localhost:5000"; // iOS simulator / web
};

const API_BASE_URL = getApiBaseUrl();

// Helper: Expo Router can pass params as arrays — always get a single string
const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

// ─── Helper: check if an error was caused by an AbortController signal ─────────
// axios v1 sets error.name === "CanceledError" when aborted via signal.
// Native fetch sets "AbortError". We check both for future-proofing.
const isAbortError = (err: unknown): boolean => {
  if (err instanceof Error) {
    return err.name === "CanceledError" || err.name === "AbortError";
  }
  return false;
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function SearchingHelpScreen() {
  const { lat, lng } = useLocalSearchParams<SearchParams>();

  const latitude  = Number(getFirstParam(lat));
  const longitude = Number(getFirstParam(lng));

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false); // brief "stopping" phase
  const [cancelled,  setCancelled]  = useState(false); // final cancelled state

  // ── Refs ──────────────────────────────────────────────────────────────────
  // AbortController for the find-nearest POST call
  const abortRef     = useRef<AbortController | null>(null);
  // Stable flag so async code can check cancellation without stale closures
  const cancelledRef = useRef(false);
  // Tracks whether the component is still mounted — prevents setState after unmount
  const mountedRef   = useRef(true);
  // Holds the "stopping" banner timeout so we can clear it on unmount
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up on unmount — mark unmounted and abort any in-flight request
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Abort any in-flight request when the component unmounts
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      // Clear the "stopping" banner timer
      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current);
        cancelTimerRef.current = null;
      }
    };
  }, []);

  // ─── Cancel handler ────────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    // Step 1: Set the cancellation flag synchronously so any in-flight
    //         async code that resumes after the abort will bail out.
    cancelledRef.current = true;

    // Step 2: Show the "Sending request is stopping…" banner immediately.
    setCancelling(true);

    // Step 3: Abort the in-flight POST request. This fires immediately —
    //         even if the server hasn't responded yet or the network is slow.
    //         axios will throw a CanceledError, which we catch and ignore.
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    // Step 4: After 800 ms, transition from "stopping" to "cancelled" UI.
    //         This gives the user enough time to see the stopping message.
    cancelTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return; // guard against unmount during timeout
      setCancelling(false);
      setCancelled(true);
      setLoading(false);
    }, 800);
  }, []);

  // ─── Try Again handler ─────────────────────────────────────────────────────
  // Resets all cancellation / error state and re-fires the search.
  // This allows the user to retry without navigating away from this screen.
  const handleTryAgain = useCallback(() => {
    // Reset all state so the effect re-runs cleanly
    cancelledRef.current = false;
    setCancelled(false);
    setCancelling(false);
    setError(null);
    setLoading(true);
  }, []);

  // ─── Find nearest rescuer ──────────────────────────────────────────────────
  // Runs on mount and again whenever the user presses "Try Again" (loading
  // goes back to true). The effect only fires when loading is true and
  // cancellation is not active.
  useEffect(() => {
    // Guard: don't start if already cancelled, or if loading is false
    // (loading being false means we already completed or errored)
    if (cancelledRef.current || !loading) return;

    const findNearest = async (): Promise<void> => {
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        if (mountedRef.current) {
          setError("Missing or invalid latitude/longitude values.");
          setLoading(false);
        }
        return;
      }

      // Create a fresh AbortController for this request and keep it in the ref.
      // handleCancel() can call controller.abort() from outside this closure.
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        console.log("[SearchingHelp] POST", `${API_BASE_URL}/api/rescue/find-nearest`);
        console.log("[SearchingHelp] Payload:", { latitude, longitude });

        // axios v1 accepts `signal` from AbortController natively —
        // the request is terminated the instant controller.abort() is called,
        // even on a slow network or long backend delay.
        const response = await axios.post<FindNearestResponse>(
          `${API_BASE_URL}/api/rescue/find-nearest`,
          { latitude, longitude },
          {
            signal: controller.signal, // ← AbortController signal
            timeout: 30000,            // 30 seconds — generous for slow networks
          } as any
        );

        // If the user cancelled while we were awaiting, discard the result.
        // This check is necessary because abort() might not have fired before
        // the response arrived on a fast network.
        if (cancelledRef.current) return;

        console.log("[SearchingHelp] Response:", response.data);

        const { rescuer, distance } = response.data;

        router.replace({
          pathname: "/rescuer-found",
          params: {
            name:      rescuer.name,
            distance:  String(distance),
            rescuerId: rescuer._id,
            avatar:    rescuer.avatar ?? "",
            phone:     rescuer.phone  ?? "",
          },
        } as never);
      } catch (requestError: unknown) {
        // Aborted intentionally — UI is already updated by handleCancel()
        if (isAbortError(requestError)) {
          console.log("[SearchingHelp] Search aborted by user.");
          return;
        }

        console.error("[SearchingHelp] Error finding rescuer:", requestError);
        if (!cancelledRef.current && mountedRef.current) {
          setError("Unable to find nearby rescuer");
          Alert.alert("Unable to find nearby rescuer", "Please go back and try again.");
        }
      } finally {
        abortRef.current = null;
        if (!cancelledRef.current && mountedRef.current) {
          setLoading(false);
        }
      }
    };

    void findNearest();

    // Cleanup: abort the request if the effect re-runs or the component unmounts
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [latitude, longitude, loading]); // `loading` dependency enables retry

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* "Stopping" banner — shown briefly after Cancel is pressed */}
      {cancelling && (
        <View style={styles.cancellingBanner}>
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.cancellingText}>Sending request is stopping…</Text>
        </View>
      )}

      {/* Main content */}
      {loading && !cancelling ? (
        <>
          <ActivityIndicator size="large" color="#2E86DE" />
          <Text style={styles.text}>Searching for Nearby Help…</Text>
        </>
      ) : cancelled ? (
        <>
          <Text style={styles.error}>Search Cancelled</Text>
          <Text style={styles.text}>
            The search was stopped.{"\n"}You can try again or go back.
          </Text>
        </>
      ) : error ? (
        <>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.text}>Please go back and try again.</Text>
        </>
      ) : null}

      {/* Searching animation (hidden after cancellation or error) */}
      {!cancelled && !error && (
        <Image
          source={require("../../assets/images/searching.gif")}
          style={styles.image}
        />
      )}

      {/* Cancel button — visible ONLY while search is actively loading */}
      {loading && !cancelling && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.75}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}

      {/* Try Again button — visible after cancellation */}
      {cancelled && !cancelling && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleTryAgain}
          activeOpacity={0.75}
        >
          <Text style={styles.cancelButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}

      {/* Go Back button — visible after cancellation or error */}
      {(cancelled || error) && !cancelling && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  cancellingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  cancellingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  text: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
    textAlign: "center",
    color: "#333",
  },
  error: {
    fontSize: 18,
    fontWeight: "700",
    color: "#B00020",
    textAlign: "center",
  },
  image: {
    width: 180,
    height: 180,
    marginTop: 30,
  },
  cancelButton: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: "#ccc",
    borderRadius: 10,
  },
  retryButton: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: "#2E86DE",
    borderRadius: 10,
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: "#f5a623",
    borderRadius: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

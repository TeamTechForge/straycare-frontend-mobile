import { useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PrimaryButton from "../../components/PrimaryButton";
import { colors } from "../../constants/colors.constants";
import { spacing } from "../../constants/spacing.constants";
import { typography } from "../../constants/typography.constants";

/**
 * Safely resolves a URL search parameter to a single string value.
 *
 * @param value - Search parameter value from Expo Router (string, string[], or undefined)
 * @param fallback - Default string return value if parameter is missing
 * @returns Evaluated string representation
 */
const safeParam = (
  value: string | string[] | undefined,
  fallback = ""
): string => (Array.isArray(value) ? value[0] : value || fallback);

/**
 * Report Submission Success Screen Component.
 *
 * Displays confirmation for a successfully submitted animal rescue report with entrance
 * spring/fade animations, summary Case ID card, and action buttons to search for nearby
 * rescuers, view case details, or return to home screen.
 */
export default function Success() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Safely extract route search parameters
  const caseId = safeParam(params.caseId, "UNKNOWN");
  const lat = safeParam(params.lat);
  const lng = safeParam(params.lng);
  const animalType = safeParam(params.animalType);
  const animalPhoto = safeParam(params.animalPhoto);
  const description = safeParam(params.description);

  // ── Entrance Animation Drivers ───────────────────────────────────────────────
  /** Scale animation driver for checkmark icon badge spring pop-in */
  const scaleAnim = useRef(new Animated.Value(0)).current;

  /** Opacity animation driver for text content and action buttons fade-in */
  const fadeAnim = useRef(new Animated.Value(0)).current;

  /** TranslateY animation driver for text content and action buttons slide-up */
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Trigger entrance sequence when component mounts
  useEffect(() => {
    Animated.sequence([
      // 1. Checkmark badge pops in with spring bounce
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      // 2. Main content and buttons simultaneously fade and slide up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [scaleAnim, fadeAnim, slideAnim]);

  /**
   * Navigates user to nearby rescuers search screen with incident location and details.
   */
  const goToFindingRescuer = () => {
    router.push({
      pathname: "/nearby-rescuers",
      params: {
        lat,
        lng,
        caseId,
        animalType,
        animalPhoto,
        description,
      },
    } as never);
  };

  /**
   * Navigates user to detailed view for the submitted report case.
   */
  const goToCaseDetails = () => {
    router.push({
      pathname: "/reporting/CaseDetails",
      params: { caseId },
    });
  };

  /**
   * Navigates user back to the app home dashboard, replacing navigation stack.
   */
  const goToHome = () => {
    router.replace("/(tabs)/Home");
  };

  return (
    <View style={styles.container}>
      {/* Decorative top gradient strip */}
      <View style={styles.topStrip} />

      {/* SUCCESS ICON — animated pop-in */}
      <Animated.View
        style={[
          styles.iconCircle,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.iconInner}>
          <Text style={styles.iconText}>✓</Text>
        </View>
      </Animated.View>

      {/* TEXT & ACTIONS — animated fade-slide */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignItems: "center",
          width: "100%",
        }}
      >
        {/* TITLE */}
        <Text style={styles.title}>Case Submitted Successfully</Text>

        {/* SUBTITLE */}
        <Text style={styles.subtitle}>
          Your rescue case has been submitted successfully.{"\n"}
          Thank you for helping keep animals safe.
        </Text>

        {/* CASE ID CARD */}
        <View style={styles.caseCard}>
          <Text style={styles.caseLabel}>CASE ID</Text>
          <Text style={styles.caseValue}>{caseId}</Text>
        </View>

        {/* BUTTONS */}
        <View style={styles.buttonGroup}>
          {/* FIND RESCUER */}
          <PrimaryButton
            title="Find Rescuer"
            onPress={goToFindingRescuer}
          />

          {/* VIEW CASE DETAILS */}
          <PrimaryButton
            title="View Case"
            onPress={goToCaseDetails}
            variant="outline"
          />

          {/* BACK TO HOME */}
          <PrimaryButton
            title="Back to Home"
            onPress={goToHome}
            variant="outline"
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
    padding: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  topStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: colors.primary,
    opacity: 0.08,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(254,185,75,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    fontSize: 44,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  title: {
    fontSize: 26,
    fontFamily: typography.bold,
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: typography.regular,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  caseCard: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.2)",
    alignItems: "center",
    marginBottom: 32,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  caseLabel: {
    fontSize: 11,
    fontFamily: typography.semibold,
    color: "#9CA3AF",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  caseValue: {
    fontSize: 24,
    fontFamily: typography.bold,
    color: colors.text,
  },
  buttonGroup: {
    width: "100%",
    gap: 10,
  },
});

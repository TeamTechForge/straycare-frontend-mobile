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

export default function Success() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const caseId = Array.isArray(params.caseId)
    ? params.caseId[0]
    : params.caseId || "UNKNOWN";

  const lat = Array.isArray(params.lat)
    ? params.lat[0]
    : params.lat || "";

  const lng = Array.isArray(params.lng)
    ? params.lng[0]
    : params.lng || "";

  const animalType = Array.isArray(params.animalType)
    ? params.animalType[0]
    : params.animalType || "";

  const animalPhoto = Array.isArray(params.animalPhoto)
    ? params.animalPhoto[0]
    : params.animalPhoto || "";

  const description = Array.isArray(params.description)
    ? params.description[0]
    : params.description || "";

  const requestId = Array.isArray(params.requestId)
    ? params.requestId[0]
    : params.requestId || "";

  const rescuerId = Array.isArray(params.rescuerId)
    ? params.rescuerId[0]
    : params.rescuerId || "";

  // ── Entrance animations ─────────────────────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Auto transition to original Rescuer Finding screen (/nearby-rescuers)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (lat && lng) {
        router.replace({
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
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [lat, lng, caseId, animalType, animalPhoto, description]);

  useEffect(() => {
    Animated.sequence([
      // 1. Checkmark pops in
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
      // 2. Text and buttons fade-slide in
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
  }, []);

  const goToFindingRescuer = () => {
    if (lat && lng) {
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
    }
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

      {/* TEXT — animated fade-slide */}
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
          {/* FIND RESCUER — primary action */}
          {lat && lng ? (
            <PrimaryButton
              title="🔍  Finding Rescuer..."
              onPress={goToFindingRescuer}
            />
          ) : null}

          {/* VIEW CASE DETAILS */}
          <PrimaryButton
            title="View Case"
            onPress={() =>
              router.push({
                pathname: "/reporting/CaseDetails",
                params: { caseId },
              })
            }
            variant="outline"
          />

          {/* GO HOME */}
          <PrimaryButton
            title="Go Home"
            onPress={() => router.push("/")}
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

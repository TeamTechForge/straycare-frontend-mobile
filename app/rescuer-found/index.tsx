// rescuer-found/index.tsx
//
// Redesigned "Rescuer Found" screen — professional, modern UI.
// Receives rescuer details via URL params from /searching-help and displays
// them in a polished card-based layout with rescuer avatar, animal image,
// stats chips, and a prominent "Request Help" CTA.
//
// All existing navigation logic is preserved (→ /request-status with rescuerId).

import React, { useState } from "react";
import {
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

import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";

// ─── Params from /searching-help ───────────────────────────────────────────────
type RescuerFoundParams = {
  name?: string | string[];
  distance?: string | string[];
  rescuerId?: string | string[];
  avatar?: string | string[];
  phone?: string | string[];
  animalType?: string | string[];
  animalPhoto?: string | string[];
  description?: string | string[];
  excludeIds?: string | string[];
  lat?: string | string[];
  lng?: string | string[];
};

const getFirstParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

// Fallback images when backend photo is missing
const FALLBACK_RESCUER_AVATAR =
  "https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=200&h=200&fit=crop&q=80";
const FALLBACK_ANIMAL_PHOTO =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop&q=80";

export default function RescuerFoundScreen() {
  // Read all rescuer + rescue info from URL params
  const params = useLocalSearchParams<RescuerFoundParams>();

  const rescuerName = getFirstParam(params.name) ?? "Nearby Rescuer";
  const rescuerDistance = getFirstParam(params.distance) ?? "0";
  const rescuerAvatar = getFirstParam(params.avatar);
  const rescuerIdValue = getFirstParam(params.rescuerId) ?? "";
  const rescuerPhone = getFirstParam(params.phone);
  const animalType = getFirstParam(params.animalType) ?? "Rescue Case";
  const animalPhoto = getFirstParam(params.animalPhoto);
  const description =
    getFirstParam(params.description) ?? "A rescue request has been matched with a nearby rescuer.";

  // ── Image loading state ──
  const [avatarError, setAvatarError] = useState(false);
  const [animalImgError, setAnimalImgError] = useState(false);

  // Resolved image URIs with fallback logic
  const avatarUri =
    !avatarError && rescuerAvatar && rescuerAvatar.length > 0
      ? rescuerAvatar
      : FALLBACK_RESCUER_AVATAR;
  const animalUri =
    !animalImgError && animalPhoto && animalPhoto.length > 0
      ? animalPhoto
      : FALLBACK_ANIMAL_PHOTO;

  // ── Call rescuer ──
  const handleCall = () => {
    if (!rescuerPhone || rescuerPhone.trim().length === 0) {
      Alert.alert(
        "Phone Unavailable",
        "The rescuer's phone number is not available.",
        [{ text: "OK" }]
      );
      return;
    }
    const cleanedPhone = rescuerPhone.replace(/[\s-]/g, "");
    const url = `tel:${cleanedPhone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Cannot Make Call", "Your device does not support phone calls.");
        }
      })
      .catch(() => {
        Alert.alert("Error", "An error occurred while trying to make the call.");
      });
  };

  // ── Navigate to request-status ──
  const handleRequestHelp = () => {
    router.push({
      pathname: "/request-status",
      params: {
        rescuerId: rescuerIdValue,
        caseId: getFirstParam(params.caseId) ?? "",
        animalType: getFirstParam(params.animalType) ?? "",
        animalPhoto: getFirstParam(params.animalPhoto) ?? "",
        description: getFirstParam(params.description) ?? "",
        excludeIds: getFirstParam(params.excludeIds) ?? "",
        lat: getFirstParam(params.lat) ?? "",
        lng: getFirstParam(params.lng) ?? "",
      },
    } as never);
  };

  // Format distance for display
  const distanceFormatted = Number(rescuerDistance).toFixed(1);
  const etaMinutes = Math.max(3, Math.round(Number(rescuerDistance) * 6));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════
         *  Header
         * ══════════════════════════════════════════ */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backPill}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Text style={styles.backChevron}>‹</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rescuer Found</Text>
          {/* Spacer to center the title */}
          <View style={{ width: 60 }} />
        </View>

        {/* ══════════════════════════════════════════
         *  Success Banner
         * ══════════════════════════════════════════ */}
        <View style={styles.successBanner}>
          <View style={styles.successIconCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <View style={styles.successTextWrap}>
            <Text style={styles.successTitle}>Match Found!</Text>
            <Text style={styles.successSubtitle}>
              A rescuer near you is ready to help.
            </Text>
          </View>
        </View>

        {/* ══════════════════════════════════════════
         *  Rescuer Profile Card
         * ══════════════════════════════════════════ */}
        <View style={styles.card}>
          {/* ── Rescuer Avatar ── */}
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              onError={() => setAvatarError(true)}
            />
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeIcon}>🐾</Text>
            </View>
          </View>

          <Text style={styles.rescuerName}>{rescuerName}</Text>
          <Text style={styles.rescuerRole}>Local Hero 🐾</Text>

          {/* ── Stats Chips ── */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipEmoji}>📍</Text>
              <Text style={styles.chipText}>{distanceFormatted} km</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipEmoji}>⏱</Text>
              <Text style={styles.chipText}>~{etaMinutes} min</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipEmoji}>✅</Text>
              <Text style={styles.chipText}>Available</Text>
            </View>
          </View>

          {/* ── Phone Button ── */}
          {rescuerPhone ? (
            <TouchableOpacity
              onPress={handleCall}
              activeOpacity={0.7}
              style={styles.phoneButton}
            >
              <Text style={styles.phoneIcon}>📞</Text>
              <Text style={styles.phoneText}>{rescuerPhone}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ══════════════════════════════════════════
         *  Animal / Rescue Details Card
         * ══════════════════════════════════════════ */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderIconCircle}>
              <Text style={styles.cardHeaderEmoji}>🐕</Text>
            </View>
            <Text style={styles.cardHeaderTitle}>Rescue Details</Text>
          </View>

          {/* ── Animal Image ── */}
          <View style={styles.animalImageWrapper}>
            <Image
              source={{ uri: animalUri }}
              style={styles.animalImage}
              resizeMode="cover"
              onError={() => setAnimalImgError(true)}
            />
          </View>

          {/* ── Details Row ── */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Animal Type</Text>
            <Text style={styles.detailValue}>{animalType}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailValue}>{description}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Distance</Text>
            <Text style={styles.detailValue}>{distanceFormatted} km away</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Est. Arrival</Text>
            <Text style={styles.detailValue}>~{etaMinutes} minutes</Text>
          </View>
        </View>

        {/* ══════════════════════════════════════════
         *  Location Card
         * ══════════════════════════════════════════ */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderIconCircle}>
              <Text style={styles.cardHeaderEmoji}>📍</Text>
            </View>
            <Text style={styles.cardHeaderTitle}>Location Info</Text>
          </View>
          <Text style={styles.locationNote}>
            The rescuer is approximately{" "}
            <Text style={{ fontFamily: typography.bold, color: colors.primary }}>
              {distanceFormatted} km
            </Text>{" "}
            from your current location and should arrive in about{" "}
            <Text style={{ fontFamily: typography.bold, color: colors.primary }}>
              {etaMinutes} minutes
            </Text>
            .
          </Text>
        </View>

        {/* ══════════════════════════════════════════
         *  CTA Buttons
         * ══════════════════════════════════════════ */}
        <TouchableOpacity
          style={styles.requestBtn}
          activeOpacity={0.85}
          onPress={handleRequestHelp}
        >
          <Text style={styles.requestBtnText}>Request Help</Text>
          <View style={styles.requestBtnArrow}>
            <Text style={styles.requestBtnArrowText}>❯</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.callBtn}
          activeOpacity={0.85}
          onPress={handleCall}
        >
          <View style={styles.callBtnIconCircle}>
            <Text style={styles.callBtnIcon}>📞</Text>
          </View>
          <Text style={styles.callBtnText}>
            Call {rescuerName}
          </Text>
        </TouchableOpacity>

        {/* ── Footer Note ── */}
        <View style={styles.footerBanner}>
          <View style={styles.footerIconCircle}>
            <Text style={styles.footerIcon}>🐾</Text>
          </View>
          <View style={styles.footerTextWrap}>
            <Text style={styles.footerTitle}>
              Every small action creates a big change.
            </Text>
            <Text style={styles.footerSubtitle}>
              Thank you for being a voice for the voiceless.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ═══════════════════════════════════════════════
 *  Styles — matches app-wide design system
 * ═══════════════════════════════════════════════ */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  page: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
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
    marginTop: -2,
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

  // ── Success Banner ──
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  successIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  successTextWrap: {
    flex: 1,
    gap: 2,
  },
  successTitle: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: "#065F46",
  },
  successSubtitle: {
    fontFamily: typography.regular,
    fontSize: 12,
    color: "#047857",
  },

  // ── Card ──
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.12)",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },

  // ── Avatar ──
  avatarWrapper: {
    position: "relative",
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F3F4F6",
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarBadgeIcon: {
    fontSize: 14,
  },

  // ── Rescuer Info ──
  rescuerName: {
    fontSize: 22,
    fontFamily: typography.bold,
    color: colors.text,
    marginBottom: 2,
  },
  rescuerRole: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: "#6B7280",
    marginBottom: spacing.sm,
  },

  // ── Stats Chips ──
  chipsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8EA",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.2)",
  },
  chipEmoji: {
    fontSize: 12,
  },
  chipText: {
    fontFamily: typography.semibold,
    fontSize: 12,
    color: colors.text,
  },

  // ── Phone Button ──
  phoneButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: 6,
    marginTop: 4,
  },
  phoneIcon: {
    fontSize: 14,
  },
  phoneText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: colors.primary,
  },

  // ── Card Header Row ──
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  cardHeaderIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF8EA",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderEmoji: {
    fontSize: 16,
  },
  cardHeaderTitle: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.text,
  },

  // ── Animal Image ──
  animalImageWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: spacing.sm,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.15)",
  },
  animalImage: {
    width: "100%",
    height: "100%",
  },

  // ── Detail Rows ──
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
    paddingVertical: 8,
  },
  detailLabel: {
    fontFamily: typography.medium,
    fontSize: 13,
    color: "#6B7280",
    flex: 0.4,
  },
  detailValue: {
    fontFamily: typography.semibold,
    fontSize: 13,
    color: colors.text,
    flex: 0.6,
    textAlign: "right",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#F3F4F6",
  },

  // ── Location Note ──
  locationNote: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
    alignSelf: "flex-start",
  },

  // ── Request Help Button ──
  requestBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  requestBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: typography.bold,
    flex: 1,
    textAlign: "center",
  },
  requestBtnArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  requestBtnArrowText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "bold",
  },

  // ── Call Button ──
  callBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  callBtnIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF8EA",
    alignItems: "center",
    justifyContent: "center",
  },
  callBtnIcon: {
    fontSize: 14,
  },
  callBtnText: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: typography.bold,
    flex: 1,
    textAlign: "center",
  },

  // ── Footer Banner ──
  footerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8EA",
    borderRadius: 20,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.15)",
  },
  footerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.2)",
  },
  footerIcon: {
    fontSize: 14,
  },
  footerTextWrap: {
    flex: 1,
    gap: 2,
  },
  footerTitle: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: colors.text,
  },
  footerSubtitle: {
    fontSize: 10,
    fontFamily: typography.regular,
    color: "#6B7280",
  },
});

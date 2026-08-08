// ──────────────────────────────────────────────────────────────────────────────
// RescueCaseCard.tsx — Premium rescue card with REAL animal images from backend
//
// ▸ Resolves the image from item.photoUrl → item.photos[0] → fallback
// ▸ Prefixes relative backend paths with the API base URL
// ▸ Shows a shimmer placeholder while the image loads
// ▸ Shows a fallback icon if the image fails to load
// ▸ Consistent #FEB94B theme with elevated card shadows
// ──────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../../constants/colors.constants";
import { spacing } from "../../constants/spacing.constants";
import { typography } from "../../constants/typography.constants";
import { getApiBaseUrl } from "../../services/rescueService";
import type { RescueCaseRecord } from "../../types/Api";

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  /** The rescue case data from the backend */
  item: RescueCaseRecord;
  /** Optional label for the primary action button (e.g. "Live Tracking") */
  primaryActionLabel?: string;
  /** Callback when the primary action button is pressed */
  onPrimaryAction?: (item: RescueCaseRecord) => void;
  /** Optional secondary label shown below the description */
  secondaryLabel?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

/** Default fallback image when no photo is available from backend */
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop&q=80";

/** Status badge color mapping — consistent across all tabs */
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: "#FFF7E6", text: "#B8860B", dot: "#FEB94B" },
  accepted:  { bg: "#E8F5E9", text: "#2E7D32", dot: "#4CAF50" },
  completed: { bg: "#E8F5E9", text: "#1B5E20", dot: "#43A047" },
  rejected:  { bg: "#FFEBEE", text: "#C62828", dot: "#EF5350" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolves the best available photo URL from the rescue case item.
 * Priority: item.photoUrl → item.photos[0] → fallback
 * Relative paths (e.g. /uploads/photo.jpg) are prefixed with the API base URL.
 */
const resolvePhotoUrl = (item: RescueCaseRecord): string => {
  const baseUrl = getApiBaseUrl();

  // Try photoUrl first, then first non-empty photo in the array
  const rawUrl =
    item.photoUrl?.trim() ||
    item.photos?.find((p) => typeof p === "string" && p.trim().length > 0)?.trim() ||
    "";

  if (!rawUrl) return FALLBACK_IMAGE;

  // If it's already an absolute URL, use it directly
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }

  // Otherwise, prefix with the API base URL (handles /uploads/... and /api/upload/files/...)
  return `${baseUrl}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
};

/**
 * Formats a date string into a human-readable short format.
 * e.g. "Jun 7, 2:30 PM"
 */
const formatTime = (value: string): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "—";
  }
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function RescueCaseCard({
  item,
  primaryActionLabel,
  onPrimaryAction,
  secondaryLabel,
}: Props) {
  // ── Image state management ──
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // ── Memoized values ──
  const photoUrl = useMemo(() => resolvePhotoUrl(item), [item]);
  const statusStyle = STATUS_COLORS[item.status] ?? STATUS_COLORS.pending;

  // ── Image event handlers ──
  const handleImageLoad = useCallback(() => setImageLoading(false), []);
  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  return (
    <View style={styles.card}>
      {/* ── Animal Image with loading/error states ── */}
      <View style={styles.imageContainer}>
        {/* Show the real backend image */}
        {!imageError ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.image}
            resizeMode="cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          /* Fallback state when image fails to load */
          <View style={styles.imageFallback}>
            <Text style={styles.fallbackEmoji}>🐾</Text>
            <Text style={styles.fallbackText}>Photo unavailable</Text>
          </View>
        )}

        {/* Shimmer loading overlay — shown while image is downloading */}
        {imageLoading && !imageError && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {/* Status badge overlaid on the image — top right corner */}
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {item.status}
          </Text>
        </View>

        {/* Animal type label overlaid on image — bottom left */}
        <View style={styles.animalTypeBadge}>
          <Text style={styles.animalTypeText}>{item.animalType}</Text>
        </View>
      </View>

      {/* ── Card Content ── */}
      <View style={styles.content}>
        {/* Title row — animal type + timestamp */}
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.description || "Rescue Case"}
          </Text>
          <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
        </View>

        {/* Divider line for visual separation */}
        <View style={styles.divider} />

        {/* Meta info grid — reporter, rescuer, ETA, distance, location */}
        <View style={styles.metaGrid}>
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>👤</Text>
            <Text style={styles.metaLabel}>Reporter:</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {item.reporter?.name || item.reporterName || "Reporter"}
              {(item.reporter?.phone || item.reporterPhone) ? ` • ${item.reporter?.phone || item.reporterPhone}` : ""}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>🚑</Text>
            <Text style={styles.metaLabel}>Rescuer:</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {item.rescuer?.name || item.rescuerName || "Awaiting assignment"}
              {(item.rescuer?.phone || item.rescuerPhone) ? ` • ${item.rescuer?.phone || item.rescuerPhone}` : ""}
            </Text>
          </View>

          <View style={styles.metaRowCompact}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipIcon}>⏱</Text>
              <Text style={styles.metaChipText}>
                ETA: {item.etaMinutes ?? "—"} min
              </Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipIcon}>📍</Text>
              <Text style={styles.metaChipText}>
                {(item.distanceKm ?? 0).toFixed(1)} km
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>📌</Text>
            <Text style={styles.metaValue} numberOfLines={2}>
              {item.location?.address ||
                `${item.location?.latitude ?? 0}, ${item.location?.longitude ?? 0}`}
            </Text>
          </View>
        </View>

        {/* Summary / secondary label */}
        {(secondaryLabel || item.summary) && (
          <View style={styles.summaryWrap}>
            <Text style={styles.summaryText} numberOfLines={2}>
              {secondaryLabel ?? item.summary}
            </Text>
          </View>
        )}

        {/* Primary action button — e.g. "Live Tracking" */}
        {primaryActionLabel && onPrimaryAction ? (
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
            onPress={() => onPrimaryAction(item)}
          >
            <Text style={styles.primaryButtonText}>{primaryActionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
// All styles use the #FEB94B primary color, consistent rounded corners,
// elevated shadows, and harmonious spacing from the design system.

const CARD_RADIUS = 20;
const IMAGE_HEIGHT = 200;

const styles = StyleSheet.create({
  // ── Card container ──
  card: {
    backgroundColor: colors.white,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    marginBottom: spacing.md,
    // Elevated shadow for premium feel
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    // Subtle border for definition
    borderWidth: 1,
    borderColor: "rgba(254, 185, 75, 0.2)",
  },

  // ── Image section ──
  imageContainer: {
    width: "100%",
    height: IMAGE_HEIGHT,
    backgroundColor: "#FFF8EA",
    position: "relative",
  },
  image: {
    width: "100%",
    height: IMAGE_HEIGHT,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFF8EA",
    justifyContent: "center",
    alignItems: "center",
  },
  imageFallback: {
    width: "100%",
    height: IMAGE_HEIGHT,
    backgroundColor: "#FFF3D6",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  fallbackText: {
    fontFamily: typography.medium,
    color: "#B8860B",
    fontSize: 13,
  },

  // ── Status badge (top-right overlay on image) ──
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: typography.semibold,
    fontSize: 11,
    textTransform: "capitalize",
    letterSpacing: 0.3,
  },

  // ── Animal type badge (bottom-left overlay on image) ──
  animalTypeBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  animalTypeText: {
    fontFamily: typography.bold,
    color: "#1A1A1A",
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // ── Content section ──
  content: {
    padding: spacing.md,
    gap: 12,
  },

  // ── Header row ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: typography.semibold,
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  timestamp: {
    fontFamily: typography.medium,
    color: "#9CA3AF",
    fontSize: 11,
    marginTop: 2,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: "rgba(254, 185, 75, 0.15)",
  },

  // ── Meta info ──
  metaGrid: {
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaIcon: {
    fontSize: 13,
    width: 20,
    textAlign: "center",
  },
  metaLabel: {
    fontFamily: typography.semibold,
    color: "#6B7280",
    fontSize: 12,
  },
  metaValue: {
    flex: 1,
    fontFamily: typography.medium,
    color: "#374151",
    fontSize: 12,
  },
  metaRowCompact: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 2,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8EA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(254, 185, 75, 0.25)",
  },
  metaChipIcon: {
    fontSize: 12,
  },
  metaChipText: {
    fontFamily: typography.semibold,
    color: "#92711B",
    fontSize: 11,
  },

  // ── Summary ──
  summaryWrap: {
    backgroundColor: "#FAFAF7",
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  summaryText: {
    fontFamily: typography.medium,
    color: "#4B5563",
    fontSize: 12,
    lineHeight: 18,
  },

  // ── Primary action button ──
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
    // Subtle shadow on the button
    shadowColor: "#FEB94B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    fontFamily: typography.bold,
    color: "#1A1A1A",
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
// ──────────────────────────────────────────────────────────────────────────────
// rescueHistory.styles.ts — Polished, consistent styles for the Rescue History
// screen. Uses #FEB94B as the primary theme color throughout.
// ──────────────────────────────────────────────────────────────────────────────

import { StyleSheet } from "react-native";

import { colors } from "../constants/colors.constants";
import { spacing } from "../constants/spacing.constants";
import { typography } from "../constants/typography.constants";

export const rescueHistoryStyles = StyleSheet.create({
  // ── Page wrapper ──
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },

  // ── Header ──
  title: {
    fontSize: typography.title,
    fontFamily: typography.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: spacing.xs,
    color: "#6B7280",
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 20,
  },

  // ── Stats row (Pending / Completed / All counters) ──
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#FFF8EA",
    borderWidth: 1,
    borderColor: "rgba(254, 185, 75, 0.3)",
    // Subtle shadow for elevation
    shadowColor: "#FEB94B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: typography.semibold,
    color: "#92711B",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontFamily: typography.bold,
    color: colors.text,
  },

  // ── Tab bar ──
  tabs: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#FFF3D6",
    borderRadius: 16,
    padding: 5,
    marginBottom: spacing.md,
    // Slight inset shadow effect
    borderWidth: 1,
    borderColor: "rgba(254, 185, 75, 0.15)",
  },
  tabButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
    // Elevated active tab
    shadowColor: "#FEB94B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontFamily: typography.semibold,
    color: "#92711B",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: "#1A1A1A",
    fontFamily: typography.bold,
  },

  // ── Content area ──
  contentWrap: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
    paddingTop: 4,
  },

  // ── Empty / loading state ──
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontFamily: typography.medium,
    fontSize: 14,
    paddingVertical: 40,
    lineHeight: 22,
  },

  // ── Footer button ──
  footerButtonWrap: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
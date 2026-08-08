import { Platform, StyleSheet } from "react-native";

import { colors } from "../constants/colors.constants";
import { spacing } from "../constants/spacing.constants";
import { typography } from "../constants/typography.constants";

export const liveTrackingStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF9F6" },
  page: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 40 },
  title: {
    fontSize: typography.title,
    fontFamily: typography.bold,
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontFamily: typography.medium,
    color: "#5F6773",
  },
  mapCard: {
    marginTop: spacing.md,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.15)",
    backgroundColor: colors.white,
    minHeight: 300,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  map: {
    flex: 1,
    minHeight: 300,
  },
  sectionCard: {
    marginTop: spacing.md,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.15)",
    padding: spacing.md,
    gap: spacing.sm,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  sectionTitle: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.text,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "#FFF2D8",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipText: {
    fontFamily: typography.semibold,
    color: colors.text,
    fontSize: 12,
  },
  metaText: {
    fontFamily: typography.medium,
    color: "#4B5563",
    lineHeight: 20,
  },
  statusBanner: {
    backgroundColor: "#FFF4D8",
    borderRadius: 18,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statusText: {
    fontFamily: typography.bold,
    color: colors.text,
    fontSize: 14,
  },
  helperText: {
    marginTop: 6,
    fontFamily: typography.medium,
    color: "#6B7280",
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 24,
    color: "#6B7280",
    fontFamily: typography.medium,
  },

  // ── Call Rescuer Button ──────────────────────────────────────────────────
  callButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  callIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  callIcon: {
    fontSize: 16,
  },
  callButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: typography.bold,
    letterSpacing: 0.3,
  },

  // ── Comment Section ─────────────────────────────────────────────────────
  commentCard: {
    marginTop: spacing.md,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.15)",
    padding: spacing.md,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  commentHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF8EA",
    alignItems: "center",
    justifyContent: "center",
  },
  commentHeaderEmoji: {
    fontSize: 16,
  },
  commentHeaderTitle: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  commentCount: {
    fontFamily: typography.medium,
    fontSize: 12,
    color: "#9CA3AF",
  },

  // ── Input Row ───────────────────────────────────────────────────────────
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 42,
  },
  commentSendBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  commentSendIcon: {
    fontSize: 16,
    color: "#FFFFFF",
  },

  // ── Individual Comment Bubble ───────────────────────────────────────────
  commentBubble: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  commentBubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 4,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF2D8",
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: colors.primary,
  },
  commentUserName: {
    fontFamily: typography.semibold,
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  commentTime: {
    fontFamily: typography.regular,
    fontSize: 10,
    color: "#9CA3AF",
  },
  commentText: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: "#374151",
    lineHeight: 19,
    marginLeft: 34, // align with text next to avatar
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 34,
    marginTop: 4,
    gap: spacing.sm,
  },
  replyTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  replyTriggerText: {
    fontFamily: typography.semibold,
    fontSize: 11,
    color: colors.primary,
  },

  // ── Reply Bubble ────────────────────────────────────────────────────────
  replyContainer: {
    marginLeft: 28,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(254,185,75,0.25)",
    paddingLeft: spacing.sm,
    marginTop: 2,
  },
  replyBubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  // ── Reply Input Row ─────────────────────────────────────────────────────
  replyInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginLeft: 28,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  replyInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontFamily: typography.regular,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minHeight: 36,
  },
  replySendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Loading / Empty States ──────────────────────────────────────────────
  commentLoading: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  commentEmpty: {
    textAlign: "center",
    paddingVertical: spacing.md,
    fontFamily: typography.medium,
    fontSize: 13,
    color: "#9CA3AF",
  },
});
import { Platform, StyleSheet } from "react-native";
import { colors } from "../constants/colors.constants";
import { spacing } from "../constants/spacing.constants";
import { typography } from "../constants/typography.constants";

export const rescueDetailsStyles = StyleSheet.create({
  // ── Main Page Layout ──
  safe: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(254, 185, 75, 0.2)",
    marginRight: spacing.sm,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  backIcon: {
    fontSize: 18,
    color: colors.primary,
    fontFamily: typography.bold,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.title,
    fontFamily: typography.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.small,
    fontFamily: typography.medium,
    color: "#6B7280",
    marginTop: 2,
  },

  // ── Loading & Error States ──
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    fontFamily: typography.medium,
    color: "#C62828",
    fontSize: typography.body,
    textAlign: "center",
  },
  helperText: {
    fontFamily: typography.medium,
    color: "#6B7280",
    fontSize: typography.body,
    textAlign: "center",
  },

  // ── Large Card Layouts ──
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(254, 185, 75, 0.15)",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  cardTitle: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },

  // ── Animal Image Section ──
  imageCard: {
    padding: 0,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 240,
    backgroundColor: "#FFF8EA",
    position: "relative",
  },
  largeImage: {
    width: "100%",
    height: 240,
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFF8EA",
    justifyContent: "center",
    alignItems: "center",
  },
  imageFallback: {
    width: "100%",
    height: 240,
    backgroundColor: "#FFF3D6",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  fallbackText: {
    fontFamily: typography.semibold,
    color: "#B8860B",
    fontSize: 13,
  },

  // ── Overlay Badges ──
  statusBadge: {
    position: "absolute",
    top: 14,
    right: 14,
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
    fontFamily: typography.bold,
    fontSize: 11,
    textTransform: "capitalize",
    letterSpacing: 0.3,
  },
  animalTypeBadge: {
    position: "absolute",
    bottom: 14,
    left: 14,
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
  timelineIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  timelineIndicatorActive: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  timelineIndicatorInactive: {
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  timelineIcon: {
    fontSize: 10,
    color: "#FFFFFF",
    fontFamily: typography.bold,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  timelineLineActive: {
    backgroundColor: colors.primary,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  timelineStepTitle: {
    fontFamily: typography.semibold,
    fontSize: 14,
    color: colors.text,
  },
  timelineStepTitleActive: {
    color: "#92711B",
  },
  timelineStepSub: {
    fontFamily: typography.medium,
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  // ── Details Grid Rows ──
  grid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailIcon: {
    fontSize: 16,
    width: 28,
    color: colors.primary,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: typography.semibold,
    color: "#6B7280",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: typography.semibold,
    color: colors.text,
    fontSize: 13,
    marginTop: 1,
  },

  // Outcomes summary block
  outcomeBox: {
    marginTop: spacing.sm,
    backgroundColor: "#FFF8EA",
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(254, 185, 75, 0.2)",
  },
  outcomeTitle: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: "#92711B",
    marginBottom: spacing.sm,
  },
  outcomeInner: {
    gap: 6,
  },
  outcomeText: {
    fontFamily: typography.medium,
    color: colors.text,
    fontSize: 13,
  },

  // ── Map Preview ──
  mapPreviewCard: {
    padding: 0,
    overflow: "hidden",
  },
  mapPreviewHeader: {
    padding: spacing.md,
    paddingBottom: 0,
  },
  map: {
    width: "100%",
    height: 150,
    marginTop: spacing.sm,
  },
  mapBanner: {
    backgroundColor: "#FFF8EA",
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(254, 185, 75, 0.15)",
  },
  mapBannerText: {
    fontFamily: typography.bold,
    fontSize: 12,
    color: "#92711B",
  },

  // ── Contact / Rescuer / Reporter Card ──
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  profileSectionLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarInitials: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF2D8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarInitialsText: {
    fontFamily: typography.bold,
    fontSize: 18,
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.text,
  },
  profileRole: {
    fontFamily: typography.semibold,
    fontSize: 11,
    color: "#6B7280",
    textTransform: "uppercase",
    marginTop: 2,
  },
  profilePhone: {
    fontFamily: typography.medium,
    fontSize: 12,
    color: "#4B5563",
    marginTop: 1,
  },
  callIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  callIconText: {
    fontSize: 16,
    color: "#FFFFFF",
  },

  // ── Comments Section ──
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  commentHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF8EA",
    alignItems: "center",
    justifyContent: "center",
  },
  commentHeaderEmoji: {
    fontSize: 14,
  },
  commentHeaderTitle: {
    fontFamily: typography.bold,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  commentCount: {
    fontFamily: typography.medium,
    fontSize: 12,
    color: "#9CA3AF",
  },

  // Input Box
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
    fontSize: 13,
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
  commentSendBtnDisabled: {
    opacity: 0.5,
  },
  commentSendIcon: {
    fontSize: 15,
    color: "#FFFFFF",
  },

  // Threaded Bubbles
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF2D8",
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    fontSize: 10,
    fontFamily: typography.bold,
    color: colors.primary,
  },
  commentUserName: {
    fontFamily: typography.semibold,
    fontSize: 12,
    color: colors.text,
    flex: 1,
  },
  commentTime: {
    fontFamily: typography.regular,
    fontSize: 9,
    color: "#9CA3AF",
  },
  commentText: {
    fontFamily: typography.regular,
    fontSize: 12,
    color: "#374151",
    lineHeight: 18,
    marginLeft: 28,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 28,
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
    fontSize: 10,
    color: colors.primary,
  },

  // Replies
  replyContainer: {
    marginLeft: 24,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(254,185,75,0.2)",
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

  // Reply inputs
  replyInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginLeft: 24,
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
    fontSize: 12,
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

  // Empty comments state
  commentEmpty: {
    textAlign: "center",
    paddingVertical: spacing.md,
    fontFamily: typography.medium,
    fontSize: 12,
    color: "#9CA3AF",
  },
  commentLoading: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  
  // ── Rescuer Action Bar ──
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? 30 : spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
  },
});

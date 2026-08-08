import { StyleSheet, Platform } from "react-native";
import { colors } from "../constants/colors.constants";
import { spacing } from "../constants/spacing.constants";
import { typography } from "../constants/typography.constants";

/* ─── Shared shadow helper ────────────────────────────────────────────── */
const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
}) as object;

const lightShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  android: { elevation: 2 },
}) as object;

export const forumStyles = StyleSheet.create({
  /* ─── Layout ─────────────────────────────────────────────────────────── */
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },

  /* ─── Header ─────────────────────────────────────────────────────────── */
  headerContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.title,
    fontFamily: typography.bold,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.small,
    fontFamily: typography.regular,
    color: "#7A7A7A",
  },

  /* ─── Tab Bar ────────────────────────────────────────────────────────── */
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFF3D6",
    borderRadius: 16,
    padding: 5,
    marginBottom: spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    ...lightShadow,
  },
  tabText: {
    fontSize: typography.body,
    fontFamily: typography.semibold,
    color: "#92711B",
  },
  tabTextActive: {
    color: colors.text,
    fontFamily: typography.bold,
  },

  /* ─── Post List ──────────────────────────────────────────────────────── */
  list: {
    flex: 1,
  },

  /* ─── Post Card ──────────────────────────────────────────────────────── */
  postCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...cardShadow,
  },

  /* Tag badge */
  tagBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  tagBadgeGeneral: {
    backgroundColor: "#FFF3D6",
  },
  tagBadgeHealth: {
    backgroundColor: "#E8F5E9",
  },
  tagText: {
    fontSize: 11,
    fontFamily: typography.bold,
    letterSpacing: 0.5,
  },
  tagTextGeneral: {
    color: "#92711B",
  },
  tagTextHealth: {
    color: "#2E7D32",
  },

  /* Post content */
  postTitle: {
    fontSize: typography.section,
    fontFamily: typography.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 24,
  },

  /* Author row */
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF3D6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs,
  },
  avatarText: {
    fontSize: typography.small,
    fontFamily: typography.bold,
    color: "#92711B",
  },
  authorName: {
    fontSize: typography.body,
    fontFamily: typography.medium,
    color: colors.text,
  },
  timeText: {
    fontSize: typography.small,
    fontFamily: typography.regular,
    color: "#999999",
    marginLeft: spacing.xs,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: spacing.sm,
  },

  /* Action row */
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8EA",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnLiked: {
    backgroundColor: "#FFF0D0",
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontFamily: typography.semibold,
    color: colors.text,
    fontSize: 13,
  },
  actionTextLiked: {
    color: "#D4881E",
  },

  /* Meta row (legacy compat) */
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: typography.small,
    fontFamily: typography.regular,
    color: "#999999",
  },
  metaDot: {
    marginHorizontal: spacing.xs,
    color: "#CCCCCC",
  },

  /* ─── Comments Box ───────────────────────────────────────────────────── */
  commentsBox: {
    marginTop: spacing.sm,
    backgroundColor: "#FFF8EA",
    padding: spacing.sm,
    borderRadius: 12,
  },
  commentText: {
    fontSize: typography.body,
    fontFamily: typography.regular,
    color: colors.text,
    marginBottom: spacing.xs,
  },

  /* ─── Comment Input ──────────────────────────────────────────────────── */
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: typography.body,
    fontFamily: typography.regular,
    color: colors.text,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...lightShadow,
  },
  sendText: {
    fontFamily: typography.bold,
    fontSize: typography.body,
    color: "#1A1A1A",
  },

  /* ─── Bottom Actions ─────────────────────────────────────────────────── */
  bottomRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  addBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    ...lightShadow,
  },
  addBtnText: {
    textAlign: "center",
    fontFamily: typography.bold,
    fontSize: typography.body,
    color: "#1A1A1A",
  },
  closeBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  closeBtnText: {
    textAlign: "center",
    fontFamily: typography.bold,
    fontSize: typography.body,
    color: "#555555",
  },

  /* ─── State Screens ──────────────────────────────────────────────────── */
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  stateEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  stateTitle: {
    fontSize: typography.section,
    fontFamily: typography.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stateMessage: {
    fontSize: typography.body,
    fontFamily: typography.regular,
    color: "#999999",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    ...lightShadow,
  },
  retryBtnText: {
    fontFamily: typography.bold,
    fontSize: typography.body,
    color: "#1A1A1A",
  },
});

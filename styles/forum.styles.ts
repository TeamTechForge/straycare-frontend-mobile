import { StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

export const forumStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, padding: spacing.xl },
  title: { fontSize: typography.title, fontFamily: typography.bold },

  tabs: { flexDirection: "row", gap: 6, marginBottom: spacing.md },
  tabBtn: { flex: 1, padding: 8, borderRadius: 20, alignItems: "center" },
  tabBtnActive: { backgroundColor: colors.white },
  tabText: { fontFamily: typography.semibold },
  tabTextActive: { color: colors.text },

  list: { flex: 1 },

  postCard: { backgroundColor: "#FAFAFA", padding: spacing.md, borderRadius: 14, marginBottom: spacing.md },
  postTitle: { fontFamily: typography.semibold, marginBottom: 6 },

  metaRow: { flexDirection: "row" },
  metaText: { fontSize: 12 },
  metaDot: { marginHorizontal: 6 },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  actionBtn: { padding: 8, backgroundColor: "#EEE", borderRadius: 12 },

  commentsBox: { marginTop: 10, backgroundColor: "#FFF7EA", padding: 10, borderRadius: 12 },
  commentText: { marginBottom: 6 },

  commentInputRow: { flexDirection: "row", gap: 6 },
  commentInput: { flex: 1, backgroundColor: "#FFF", padding: 8, borderRadius: 8 },
  sendText: { fontFamily: typography.bold },

  actionText: {
  fontFamily: typography.semibold,
  color: colors.text,
  fontSize: 13,
},

  bottomRow: { flexDirection: "row", gap: 10, marginTop: spacing.md },
  addBtn: { flex: 1, backgroundColor: colors.primary, padding: 12, borderRadius: 12 },
  addBtnText: { textAlign: "center", fontFamily: typography.bold },
  closeBtn: { flex: 1, backgroundColor: "#EEE", padding: 12, borderRadius: 12 },
  closeBtnText: { textAlign: "center", fontFamily: typography.bold },
});

import { StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

export const rescueDetailsStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },

  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.lg,
  },

  title: {
    textAlign: "center",
    fontSize: typography.section,
    fontFamily: typography.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },

  imageWrap: {
    alignItems: "center",
    marginBottom: spacing.md,
  },

  image: {
    width: 210,
    height: 210,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2F80ED",
  },

  outcomeBox: {
    marginTop: spacing.md,
    backgroundColor: "#F6E9D4",
    borderRadius: 16,
    padding: spacing.md,
  },

  outcomeTitle: {
    fontFamily: typography.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  outcomeInner: {
    backgroundColor: "#FDF2DF",
    borderRadius: 12,
    padding: spacing.md,
  },

  outcomeText: {
    fontFamily: typography.medium,
    color: colors.text,
    marginBottom: 4,
    fontSize: typography.body,
  },
});

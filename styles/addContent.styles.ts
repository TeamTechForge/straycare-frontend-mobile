import { StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 28,
    color: colors.text,
    lineHeight: 28,
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.semibold,
    fontSize: 18,
    color: colors.text,
  },

  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },

  inputCard: {
    width: "100%",
    height: 360,
    backgroundColor: "#F7F1E6", // like your figma light cream
    borderRadius: 16,
    padding: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: typography.regular,
    fontSize: 15,
    color: colors.text,
  },

  publishBtn: {
    marginTop: spacing.xl,
    alignSelf: "center",
    minWidth: 200,
    borderRadius: 14,
  },
});

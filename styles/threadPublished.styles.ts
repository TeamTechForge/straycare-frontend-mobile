import { StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },

  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.card,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: "center",
  },

  circleWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  ring: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0,0,0,0.05)",
  },

  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2ECC71",
    alignItems: "center",
    justifyContent: "center",
  },

  check: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: typography.bold,
    marginTop: -2,
  },

  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  dotLeft: { left: 20, top: 70, backgroundColor: "#8BCF9B" },
  dotRight: { right: 24, top: 44, backgroundColor: colors.primary },
  dotBottom: {
    bottom: 22,
    left: 70,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D8B36B",
  },

  title: {
    textAlign: "center",
    color: colors.text,
    fontSize: 16,
    fontFamily: typography.semibold,
    lineHeight: 22,
  },

  doneBtn: {
    minWidth: 220,
  },
});

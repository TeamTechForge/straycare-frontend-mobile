import { StyleSheet } from "react-native";
import { colors } from "../constants/colors.constants";
import { spacing } from "../constants/spacing.constants";

export const layout = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gap12: {
    gap: 12,
  },
});

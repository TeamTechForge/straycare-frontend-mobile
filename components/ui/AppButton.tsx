import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors } from "../../constants/colors.constants";
import { spacing } from "../../constants/spacing.constants";
import { typography } from "../../constants/typography.constants";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "filled" | "outline";
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
};

export default function AppButton({
  title,
  onPress,
  variant = "filled",
  style,
  textStyle,
  disabled = false,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      style={[
        styles.button,
        variant === "outline" && styles.outlineButton,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === "outline" && styles.outlineText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,     // #FEB94B
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,                    // matches your design
    alignItems: "center",
    justifyContent: "center",
    minWidth: 220,
    alignSelf: "stretch",
    marginVertical: spacing.sm,
  },

  text: {
    fontSize: 16,
    fontFamily: typography.semibold,     // ✅ Inter
    color: colors.text,
  },

  outlineButton: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },

  outlineText: {
    color: colors.text,
  },

  disabled: {
    opacity: 0.5,
  },
});

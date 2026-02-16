import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

type Props = {
  label: string;
  value: string;
  style?: ViewStyle;
};

export default function InfoRow({ label, value, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.text}>
        <Text style={styles.label}>{label} :</Text> {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: "#F6E9D4",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  text: {
    fontFamily: typography.medium,
    color: colors.text,
    fontSize: typography.body,
  },
  label: {
    fontFamily: typography.bold,
  },
});

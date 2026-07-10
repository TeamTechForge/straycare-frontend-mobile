import React from "react";
import { View } from "react-native";
import AppButton from "../ui/AppButton";
import { spacing } from "../../constants/spacing.constants";

export default function ThreadBottomBar({ onClose }: { onClose: () => void }) {
  return <View style={{ marginTop: spacing.md }}><AppButton title="Close Discussion" onPress={onClose} /></View>;
}

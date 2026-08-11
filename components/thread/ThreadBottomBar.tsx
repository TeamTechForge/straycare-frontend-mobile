import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppButton from "../ui/AppButton";
import { spacing } from "../../constants/spacing.constants";

export default function ThreadBottomBar({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ marginTop: spacing.md, paddingBottom: Math.max(insets.bottom, 16) }}>
      <AppButton title="Close Discussion" onPress={onClose} />
    </View>
  );
}

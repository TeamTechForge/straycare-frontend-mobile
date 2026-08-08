import React from "react";
import { View, Text, Pressable } from "react-native";
import { styles } from "../../styles/add-content.styles";

type Props = {
  title: string;
  onBack: () => void;
};

export default function AddContentHeader({ title, onBack }: Props) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.backBtn} hitSlop={10}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>

      <Text style={styles.headerTitle}>{title}</Text>

      {/* Right spacer to keep title centered */}
      <View style={{ width: 36 }} />
    </View>
  );
}

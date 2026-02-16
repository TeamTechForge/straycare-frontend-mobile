import React from "react";
import { View, Text, Pressable } from "react-native";
import { forumStyles as styles } from "../../styles/forum.styles";

export default function ForumBottomActions({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.bottomRow}>
      <Pressable style={styles.addBtn}>
        <Text style={styles.addBtnText}>＋ Add new</Text>
      </Pressable>

      <Pressable style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeBtnText}>Close</Text>
      </Pressable>
    </View>
  );
}

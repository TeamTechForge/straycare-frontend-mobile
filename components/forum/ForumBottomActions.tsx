import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { forumStyles as styles } from "../../styles/forum.styles";

export default function ForumBottomActions({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  return (
    <View style={styles.bottomRow}>
      {/* Add New → Go to Add Content screen */}
      <Pressable
        style={styles.addBtn}
        onPress={() => router.push({ pathname: "/add-content" })
}
      >
        <Text style={styles.addBtnText}>＋ Add new</Text>
      </Pressable>

      {/* Close forum */}
      <Pressable style={styles.closeBtn} onPress={onClose}>
        <Text style={styles.closeBtnText}>Close</Text>
      </Pressable>
    </View>
  );
}

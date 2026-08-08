import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { forumStyles as styles } from "../../styles/forum.styles";

/**
 * Bottom action bar for the Discussion Forum.
 * Primary "Add New" CTA + outline "Close" button.
 */
export default function ForumBottomActions({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.bottomRow}>
        {/* Primary CTA */}
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push({ pathname: "/forum/add" })}
        >
          <Text style={styles.addBtnText}>＋ Add New</Text>
        </Pressable>

        {/* Outline close */}
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

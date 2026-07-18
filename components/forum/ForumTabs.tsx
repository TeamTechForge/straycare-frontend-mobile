import React from "react";
import { View, Text, Pressable } from "react-native";
import { forumStyles as styles } from "../../styles/forum.styles";

type TabKey = "Newest" | "Active" | "Unanswered";

/**
 * Premium tab bar for the Discussion Forum.
 * Warm #FFF3D6 background with rounded active indicator in #FEB94B.
 */
export default function ForumTabs({
  tab,
  onChange,
}: {
  tab: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const tabs: TabKey[] = ["Newest", "Active", "Unanswered"];

  return (
    <View style={styles.tabs}>
      {tabs.map((t) => {
        const isActive = tab === t;
        return (
          <Pressable
            key={t}
            onPress={() => onChange(t)}
            style={[styles.tabBtn, isActive && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {t}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

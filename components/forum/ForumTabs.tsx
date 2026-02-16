import React from "react";
import { View, Text, Pressable } from "react-native";
import { forumStyles as styles } from "../../styles/forum.styles";

type TabKey = "Newest" | "Active" | "Unanswered";

export default function ForumTabs({
  tab,
  onChange,
}: {
  tab: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <View style={styles.tabs}>
      {(["Newest", "Active", "Unanswered"] as TabKey[]).map((t) => (
        <Pressable key={t} onPress={() => onChange(t)} style={[styles.tabBtn, tab === t && styles.tabBtnActive]}>
          <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
        </Pressable>
      ))}
    </View>
  );
}

import React from "react";
import { View, Text } from "react-native";
import { threadStyles as styles } from "../../styles/thread.styles";

// header card for thread
export default function ThreadHeaderCard({ title, likes }: { title: string; likes: number }) {
  return (
    <View style={styles.headerCard}>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerActions}>
        <Text style={styles.headerLike}>👍 {likes}</Text>
        <Text style={styles.headerLike}>👎</Text>
      </View>
    </View>
  );
}

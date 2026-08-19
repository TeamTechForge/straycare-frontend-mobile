// ──────────────────────────────────────────────────────────────────────────────
// CompletedRescues.tsx — Tab content for completed rescue cases
//
// Uses the shared RescueCaseCard component with summary label.
// Consistent card spacing and empty state across all tabs.
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";
import { FlatList, Text, View } from "react-native";

import RescueCaseCard from "./RescueCaseCard";
import { rescueHistoryStyles as styles } from "../../styles/rescue-history.styles";
import type { RescueCaseRecord } from "../../types/Api";

type Props = {
  data: RescueCaseRecord[];
};

export default function CompletedRescues({ data }: Props) {
  // ── Empty state ──
  if (!data.length) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={styles.emptyText}>No completed rescues yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1 }}
      data={data}
      keyExtractor={(item) => item.rescueRequestId}
      renderItem={({ item }) => (
        <RescueCaseCard item={item} secondaryLabel={item.summary} />
      )}
      /* Consistent spacing between cards */
      ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}
// ──────────────────────────────────────────────────────────────────────────────
// PendingRescues.tsx — Tab content for pending rescue cases
//
// Uses the shared RescueCaseCard component with "Live Tracking" action button.
// Consistent card spacing and empty state across all tabs.
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";

import RescueCaseCard from "./RescueCaseCard";
import { rescueHistoryStyles as styles } from "../../styles/rescue-history.styles";
import type { RescueCaseRecord } from "../../types/Api";

type Props = {
  data: RescueCaseRecord[];
};

export default function PendingRescues({ data }: Props) {
  const router = useRouter();

  // ── Empty state ──
  if (!data.length) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={styles.emptyText}>No pending rescues right now.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1 }}
      data={data}
      keyExtractor={(item) => item.rescueRequestId}
      renderItem={({ item }) => (
        <RescueCaseCard
          item={item}
          primaryActionLabel="Live Tracking"
          onPrimaryAction={(caseItem) =>
            router.push({
              pathname: "/live-tracking/[requestId]",
              params: { requestId: caseItem.rescueRequestId },
            } as never)
          }
        />
      )}
      /* Consistent spacing between cards */
      ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}
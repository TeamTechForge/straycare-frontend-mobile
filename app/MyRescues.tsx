// ──────────────────────────────────────────────────────────────────────────────
// my-rescues.tsx — Dedicated My Rescues screen
//
// ▸ Fetches and shows only rescues created by the logged-in user
// ▸ Reuse the premium card component RescueCaseCard with real animal images
// ▸ Themed with #FEB94B primary color throughout
// ──────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, Text, View } from "react-native";
import { useRouter } from "expo-router";

import RescueCaseCard from "../components/rescue-history/RescueCaseCard";
import AppButton from "../components/ui/AppButton";
import { colors } from "../constants/colors.constants";
import { spacing } from "../constants/spacing.constants";
import { fetchUserRescues } from "../services/rescue.service";
import { rescueHistoryStyles as styles } from "../styles/rescue-history.styles";
import type { RescueCaseRecord } from "../types/Api";

export default function MyRescuesScreen() {
  const router = useRouter();
  const [rescues, setRescues] = useState<RescueCaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch user rescues on mount ──
  useEffect(() => {
    let active = true;

    const loadRescues = async () => {
      try {
        const data = await fetchUserRescues("logged-in-user");
        if (!active) return;
        setRescues(data);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        console.error("[MyRescues] Failed to load user rescues:", loadError);
        setError("Unable to load your rescues right now.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadRescues();

    return () => {
      active = false;
    };
  }, []);

  const handleViewDetails = (item: RescueCaseRecord) => {
    router.push({
      pathname: "/rescuer-response/[requestId]",
      params: {
        requestId: item.rescueRequestId || (item as any)._id || item.caseId,
        caseId: item.caseId,
      },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        {/* ── Page Header ── */}
        <Text style={styles.title}>My Rescues</Text>
        <Text style={styles.subtitle}>
          Track cases you reported and monitor their progress.
        </Text>

        {/* ── Content area — list of user's rescues ── */}
        <View style={styles.contentWrap}>
          {loading ? (
            /* Loading state */
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptyText}>Loading your rescues...</Text>
            </View>
          ) : error ? (
            /* Error state */
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>⚠️</Text>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : rescues.length === 0 ? (
            /* Empty state */
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={styles.emptyText}>🚑 You haven{"'"}t reported any rescue cases yet.</Text>
            </View>
          ) : (
            /* Rescue list */
            <FlatList
              style={{ flex: 1 }}
              data={rescues}
              keyExtractor={(item) => item.rescueRequestId}
              renderItem={({ item }) => (
                <RescueCaseCard
                  item={item}
                  primaryActionLabel="View Details"
                  onPrimaryAction={handleViewDetails}
                />
              )}
              /* Consistent spacing between cards */
              ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* ── Footer Close Button ── */}
        <View style={styles.footerButtonWrap}>
          <AppButton
            title="Close"
            onPress={() => router.back()}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

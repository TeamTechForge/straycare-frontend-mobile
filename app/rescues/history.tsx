// ──────────────────────────────────────────────────────────────────────────────
// rescue-history.tsx — Main Rescue History screen
//
// ▸ Fetches rescue data from the backend (pending, completed, all)
// ▸ Displays stat cards with counts
// ▸ Tab bar to switch between Pending / Completed / All views
// ▸ All tabs use the same updated RescueCaseCard with real animal images
// ▸ Themed with #FEB94B primary color throughout
// ──────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import AllRescues from "../../components/rescue-history/AllRescues";
import CompletedRescues from "../../components/rescue-history/CompletedRescues";
import PendingRescues from "../../components/rescue-history/PendingRescues";
import AppButton from "../../components/ui/AppButton";
import { colors } from "../../constants/colors.constants";
import { spacing } from "../../constants/spacing.constants";
import {
  fetchAllRescues,
  fetchCompletedRescues,
  fetchPendingRescues,
} from "../../services/rescueService";
import { rescueHistoryStyles as styles } from "../../styles/rescue-history.styles";
import type { RescueHistoryResponse, RescueHistoryTab } from "../../types/Api";

// ── Tab configuration ────────────────────────────────────────────────────────

const TABS: { key: RescueHistoryTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "pending", label: "Pending", icon: "time-outline" },
  { key: "completed", label: "Completed", icon: "checkmark-circle-outline" },
  { key: "all", label: "All", icon: "list-outline" },
];

// ── Initial empty state ──────────────────────────────────────────────────────

const emptyHistory: RescueHistoryResponse = {
  pending: [],
  completed: [],
  all: [],
  counts: { pending: 0, completed: 0, all: 0 },
};

// ── Screen Component ─────────────────────────────────────────────────────────

export default function RescueHistoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RescueHistoryTab>("pending");
  const [history, setHistory] = useState<RescueHistoryResponse>(emptyHistory);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch all rescue data from backend on mount ──
  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      try {
        // Fetch all three tabs in parallel for speed
        const [pending, completed, all] = await Promise.all([
          fetchPendingRescues(),
          fetchCompletedRescues(),
          fetchAllRescues(),
        ]);

        if (!active) return;

        setHistory({
          pending,
          completed,
          all,
          counts: {
            pending: pending.length,
            completed: completed.length,
            all: all.length,
          },
        });
        setError(null);
      } catch (loadError) {
        if (!active) return;
        console.error("[RescueHistory] Failed to load history:", loadError);
        setHistory(emptyHistory);
        setError("Unable to load rescue history right now.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        {/* ── Page Header ── */}
        <Text style={styles.title}>Rescue History</Text>
        <Text style={styles.subtitle}>
          Track live rescues, review completed cases, and keep every case in one place.
        </Text>

        {/* ── Stats Row — Pending / Completed / All counts ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{history.counts.pending}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>{history.counts.completed}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>All</Text>
            <Text style={styles.statValue}>{history.counts.all}</Text>
          </View>
        </View>

        {/* ── Tab Bar — Switch between rescue views ── */}
        <View style={styles.tabs}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons
                    name={tab.icon}
                    size={14}
                    color={isActive ? "#111827" : "#6B7280"}
                  />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ── Tab Content — Shows the appropriate rescue list ── */}
        <View style={styles.contentWrap}>
          {loading ? (
            /* Loading state with spinner */
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.emptyText}>Loading rescue history...</Text>
            </View>
          ) : error ? (
            /* Error state */
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Ionicons name="alert-circle-outline" size={38} color="#9CA3AF" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : activeTab === "pending" ? (
            <PendingRescues data={history.pending} />
          ) : activeTab === "completed" ? (
            <CompletedRescues data={history.completed} />
          ) : (
            <AllRescues data={history.all} />
          )}
        </View>

        {/* ── Footer Button ── */}
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

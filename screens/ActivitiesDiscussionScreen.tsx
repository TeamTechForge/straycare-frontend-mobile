import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import AppButton from "../components/ui/AppButton";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { useRouter } from "expo-router";


export default function ActivitiesDiscussionScreen() {
    const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Text style={styles.pageTitle}>Activities And Discussion</Text>

        {/* Rescue Journey Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rescue Journey</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>My Rescue</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>5</Text>
              </View>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Full Rescue{"\n"}History</Text>
              <View style={styles.pill}>
                <Text style={styles.pillText}>110</Text>
              </View>
            </View>
          </View>

          <AppButton title="View" onPress={() => router.push("/rescue-history")} />

        </View>

        {/* Discussion Forum Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Discussion Forum</Text>

          <AppButton
            title="Join Discussion"
           onPress={() => router.push("/discussion-forum")}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  page: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },

  pageTitle: {
    fontSize: typography.title,        // ✅ use typography sizes
    fontFamily: typography.bold,       // ✅ Inter-Bold
    color: colors.text,
    textAlign: "center",
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
  },

  cardTitle: {
    fontSize: typography.section,
    fontFamily: typography.semibold,   // ✅ Inter-SemiBold
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },

  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  statBox: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },

  statLabel: {
    fontSize: typography.small,
    fontFamily: typography.medium,     // ✅ Inter-Medium
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },

  pill: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 18,
    minWidth: 70,
    alignItems: "center",
  },

  pillText: {
    fontSize: 16,
    fontFamily: typography.bold,       // ✅ Inter-Bold
    color: colors.text,
  },
});

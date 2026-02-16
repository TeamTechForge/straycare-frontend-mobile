import React from "react";
import { SafeAreaView, View, Text, StyleSheet, Image, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import AppButton from "../components/ui/AppButton";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

type RescueItem = {
  id: string;
  image: string;
  status: "Completed" | "Pending";
};

const data: RescueItem[] = [
  { id: "001", image: "https://placedog.net/200/200?id=1", status: "Completed" },
  { id: "002", image: "https://placedog.net/200/200?id=2", status: "Pending" },
  { id: "003", image: "https://placedog.net/200/200?id=3", status: "Completed" },
];

export default function RescueHistoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Text style={styles.title}>Rescue History</Text>

        {/* Top stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statPill, styles.bluePill]}>
            <Text style={styles.statLabelBlue}>Total Rescues</Text>
            <Text style={styles.statNumberBlue}>123</Text>
          </View>

          <View style={[styles.statPill, styles.greenPill]}>
            <Text style={styles.statLabelGreen}>Completed Cases</Text>
            <Text style={styles.statNumberGreen}>110</Text>
          </View>
        </View>

        {/* List */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {data.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.avatar} />

              <View style={styles.cardRight}>
                <Text style={styles.rescueId}>Rescue ID : {item.id}</Text>

                <Pressable
                                    style={styles.detailsBtn}
                                    onPress={() =>
                                                    router.push({
                                                    pathname: "/rescue-details/[id]",
                                                    params: { id: item.id },
                                                    })
                                                }
                >
                                    <Text style={styles.detailsBtnText}>view details</Text>
</Pressable>


                <Text style={[styles.status, item.status === "Completed" ? styles.completed : styles.pending]}>
                  {item.status}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom close */}
        <AppButton title="Close" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },

  title: {
    fontSize: typography.title,
    fontFamily: typography.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },

  statsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },

  statPill: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
  },

  bluePill: { backgroundColor: "#DCEBFF", borderColor: "#3B82F6" },
  greenPill: { backgroundColor: "#DBFFE4", borderColor: "#22C55E" },

  statLabelBlue: { color: "#2563EB", fontFamily: typography.semibold, fontSize: 13 },
  statNumberBlue: { color: "#2563EB", fontFamily: typography.bold, fontSize: 16, marginTop: 2 },

  statLabelGreen: { color: "#16A34A", fontFamily: typography.semibold, fontSize: 13 },
  statNumberGreen: { color: "#16A34A", fontFamily: typography.bold, fontSize: 16, marginTop: 2 },

  list: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: spacing.md },

  card: {
    backgroundColor: "#FFF7EA",
    borderRadius: 14,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },

  avatar: { width: 64, height: 64, borderRadius: 12 },

  cardRight: { flex: 1 },

  rescueId: { fontFamily: typography.bold, fontSize: 16, color: colors.text, marginBottom: 8 },

  detailsBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  detailsBtnText: { fontFamily: typography.semibold, color: colors.text, fontSize: 13 },

  status: { marginTop: 8, fontSize: 12, fontFamily: typography.semibold },

  completed: { color: "#16A34A" },
  pending: { color: "#2563EB" },
});

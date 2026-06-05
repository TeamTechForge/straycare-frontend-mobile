import { StyleSheet, Text, View } from "react-native";

const BRAND_COLOR = "#F5A623";

type Stat = {
  value: string | number;
  label: string;
};

type Props = {
  stats: Stat[];
};

export default function ProfileStatsRow({ stats }: Props) {
  return (
    <View style={styles.statsCard}>
      {stats.map((item, index) => (
        <View key={index} style={styles.statItem}>
          <Text style={styles.statValue}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    marginTop: 18,
    backgroundColor: "#F5F2ED",
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: BRAND_COLOR,
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    marginTop: 2,
    fontSize: 9,
    color: "#999",
    fontWeight: "600",
  },
});
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

const BRAND_COLOR = "#F5A623";

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

export default function EmptyStateCard({ icon, title, subtitle }: Props) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name={icon} size={22} color={BRAND_COLOR} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFF5E8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    lineHeight: 16,
  },
});
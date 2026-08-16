import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BRAND_COLOR = "#F5A623";

export type TabKey = "posts" | "reports" | "saved" | "rescues";

export type TabItem = TabKey | { key: TabKey; label: string };

type Props = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
  tabs?: TabItem[];
};

export default function ProfileTabBar({ activeTab, onChange, tabs = ["reports", "posts", "saved"] }: Props) {
  return (
    <View style={styles.tabRow}>
      {tabs.map((tab) => {
        const key = typeof tab === "object" && tab !== null ? tab.key : (tab as TabKey);
        const label =
          typeof tab === "object" && tab !== null
            ? tab.label
            : typeof tab === "string" && tab.length > 0
            ? tab.charAt(0).toUpperCase() + tab.slice(1)
            : String(tab || "");

        return (
          <TouchableOpacity
            key={key}
            style={styles.tabButton}
            onPress={() => onChange(key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === key && styles.tabTextActive,
              ]}
            >
              {label}
            </Text>
            {activeTab === key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  tabButton: {
    alignItems: "center",
    paddingBottom: 10,
    flex: 1,
  },
  tabText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  tabTextActive: {
    color: BRAND_COLOR,
    fontWeight: "700",
  },
  tabUnderline: {
    marginTop: 8,
    height: 2,
    width: "60%",
    backgroundColor: BRAND_COLOR,
    borderRadius: 2,
  },
});
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BRAND_COLOR = "#F5A623";

type TabKey = "posts" | "reports" | "saved";

type Props = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

export default function ProfileTabBar({ activeTab, onChange }: Props) {
  const tabs: TabKey[] = ["posts", "reports", "saved"];

  return (
    <View style={styles.tabRow}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={styles.tabButton}
          onPress={() => onChange(tab)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab && styles.tabTextActive,
            ]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
          {activeTab === tab && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      ))}
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
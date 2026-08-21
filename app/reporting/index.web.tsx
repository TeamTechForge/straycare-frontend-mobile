import { Text, View, StyleSheet } from "react-native";

/**
 * Web fallback component for the Reporting Map Screen.
 *
 * Displays an informational message explaining that native interactive map features
 * are optimized for mobile platforms.
 */
export default function ReportingMapScreen() {
  return (
    <View style={styles.container}>
      {/* Notice Card Container */}
      <View style={styles.messageBox}>
        <Text style={styles.text}>
          Map view is only available on the mobile app.
        </Text>
        <Text style={styles.subtext}>
          Please use the mobile app to view rescue cases on the map.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  messageBox: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: "#666",
  },
});


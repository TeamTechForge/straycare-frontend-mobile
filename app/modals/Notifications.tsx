import React from "react";
import { View, StyleSheet } from "react-native";
import NotificationCenter from "../notifications/NotificationCenter";

/**
 * Notifications Modal Screen Component.
 *
 * Modal wrapper route that mounts the central `NotificationCenter` view
 * inside a modal container layout for Expo Router modal presentation.
 */
export default function NotificationsModal() {
  return (
    <View style={styles.container}>
      {/* Central Notification Center Feed Component */}
      <NotificationCenter />
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Modal Screen Container ───────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

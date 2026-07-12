import React from "react";
import { View, StyleSheet } from "react-native";
import NotificationCenter from "../notifications/NotificationCenter";

export default function NotificationsModal() {
  return (
    <View style={styles.container}>
      <NotificationCenter />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

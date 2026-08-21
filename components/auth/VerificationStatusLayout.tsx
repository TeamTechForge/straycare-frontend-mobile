import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  description: string;
  circleColor: string;
  iconColor: string;
  badgeColor: string;
  badgeIcon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
};

/**
 * Reusable layout for verification status screens (pending, rejected).
 * Encapsulates the shared header, illustration, title, description styles.
 */
export default function VerificationStatusLayout({
  title,
  description,
  circleColor,
  iconColor,
  badgeColor,
  badgeIcon,
  children,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Verification Status</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Illustration Area */}
      <View style={styles.illustrationWrapper}>
        <View style={[styles.largeCircle, { backgroundColor: circleColor }]}>
          <View style={styles.docCard}>
            <Ionicons name="document-text-outline" size={52} color={iconColor} />
          </View>

          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Ionicons name={badgeIcon} size={24} color="#fff" />
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Description */}
      <Text style={styles.description}>{description}</Text>

      {/* Action Buttons / Notes */}
      <View style={styles.contentWrapper}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  headerSpacer: {
    width: 22,
  },
  illustrationWrapper: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 28,
  },
  largeCircle: {
    width: 195,
    height: 195,
    borderRadius: 97.5,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  docCard: {
    width: 94,
    height: 110,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  badge: {
    position: "absolute",
    bottom: 36,
    right: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: "#1D1D1D",
    lineHeight: 30,
    marginBottom: 16,
  },
  description: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 24,
    color: "#666",
    marginHorizontal: 8,
  },
  contentWrapper: {
    marginTop: 18,
  },
});

import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BRAND_COLOR = "#F5A623";

type Props = {
  title: string;
  date: string;
  status: string;
  image: string;
  caseId?: string;
  onTrackPress?: () => void;
  onActionPress?: () => void;
  actionText?: string;
  onSecondaryActionPress?: () => void;
  secondaryActionText?: string;
  secondaryActionDisabled?: boolean;
  summary?: string;
  onPress?: () => void;
};

const getStatusColors = (status: string): { bg: string; text: string } => {
  switch (status?.toLowerCase()) {
    case "needs help":
      return { bg: "#FEE2E2", text: "#DC2626" }; // 🔴 Red (Map: red)
    case "request sent":
    case "pending":
      return { bg: "#FEF9C3", text: "#B45309" }; // 🟡 Yellow (Map: #FFD700)
    case "under rescue":
    case "under_rescue":
    case "in progress":
    case "accepted":
      return { bg: "#FFEDD5", text: "#EA580C" }; // 🟠 Orange (Map: orange)
    case "treated":
    case "completed":
      return { bg: "#EAF6EE", text: "#2E7D32" }; // 🟢 Green (Map: #63ac84)
    case "failed":
      return { bg: "#FEE2E2", text: "#B91C1C" };
    case "ready for adoption":
      return { bg: "#E0EEFB", text: "#1D4ED8" }; // 🔵 Blue (Map: #2476da)
    case "cancelled":
    case "closed":
      return { bg: "#F3F4F6", text: "#4B5563" }; // ⚫ Gray (Map: gray)
    default:
      return { bg: "#F3F4F6", text: "#4B5563" };
  }
};

export default function ReportPreviewCard({
  title,
  date,
  status,
  image,
  caseId,
  onTrackPress,
  onActionPress,
  actionText = "Update",
  onSecondaryActionPress,
  secondaryActionText = "Mark as Failed",
  secondaryActionDisabled = false,
  summary,
  onPress,
}: Props) {
  const statusColors = getStatusColors(status);

  return (
    <TouchableOpacity style={styles.reportCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeaderRow}>
        <Image source={{ uri: image || "https://via.placeholder.com/150" }} style={styles.reportImage} />
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{title}</Text>
          <Text style={styles.reportDate}>{date}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.reportStatusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.reportStatusText, { color: statusColors.text }]}>{status}</Text>
            </View>
            
            {onTrackPress &&
              status &&
              ["accepted", "under rescue"].includes(status.toLowerCase()) && (
                <TouchableOpacity style={styles.trackButton} onPress={onTrackPress}>
                  <Ionicons name="navigate-circle-outline" size={12} color="#FFF" />
                  <Text style={styles.trackButtonText}>Track Live</Text>
                </TouchableOpacity>
              )}

            {onActionPress && (
              <TouchableOpacity style={styles.actionButton} onPress={onActionPress}>
                <Ionicons name="create-outline" size={12} color="#FFF" />
                <Text style={styles.actionButtonText}>{actionText}</Text>
              </TouchableOpacity>
            )}

            {onSecondaryActionPress && (
              <TouchableOpacity
                style={[styles.failureButton, secondaryActionDisabled && styles.buttonDisabled]}
                onPress={onSecondaryActionPress}
                disabled={secondaryActionDisabled}
              >
                <Ionicons name="close-circle-outline" size={12} color="#FFF" />
                <Text style={styles.actionButtonText}>{secondaryActionText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {summary && summary !== "Pending rescue request" && summary !== "Completed rescue" && summary.trim() !== "" && (
        <View style={styles.timelineContainer}>
          <Text style={styles.timelineHeader}>Rescue Progress Updates:</Text>
          {summary.split("\n").filter(line => line.trim() !== "").map((step, idx) => (
            <View key={idx} style={styles.timelineStep}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineStepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  reportCard: {
    flexDirection: "column",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: "row",
    gap: 10,
  },
  reportImage: {
    width: 84,
    height: 84,
    borderRadius: 12,
  },
  reportInfo: {
    flex: 1,
    justifyContent: "center",
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222",
  },
  reportDate: {
    fontSize: 11,
    color: "#777",
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 6,
  },
  reportStatusBadge: {
    backgroundColor: "#FFF1CC",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reportStatusText: {
    color: BRAND_COLOR,
    fontSize: 10,
    fontWeight: "700",
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLOR,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  trackButtonText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLOR,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  failureButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  timelineContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  timelineHeader: {
    fontSize: 9,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timelineStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 8,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_COLOR,
    marginTop: 5,
  },
  timelineStepText: {
    flex: 1,
    fontSize: 11,
    color: "#4B5563",
    lineHeight: 15,
  },
});

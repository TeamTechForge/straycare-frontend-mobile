import { Image, StyleSheet, Text, View } from "react-native";

const BRAND_COLOR = "#F5A623";

type Props = {
  title: string;
  date: string;
  status: string;
  image: string;
};

export default function ReportPreviewCard({
  title,
  date,
  status,
  image,
}: Props) {
  return (
    <View style={styles.reportCard}>
      <Image source={{ uri: image }} style={styles.reportImage} />
      <View style={styles.reportInfo}>
        <Text style={styles.reportTitle}>{title}</Text>
        <Text style={styles.reportDate}>{date}</Text>
        <View style={styles.reportStatusBadge}>
          <Text style={styles.reportStatusText}>{status}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  reportCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: "#EFEFEF",
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
  reportStatusBadge: {
    marginTop: 8,
    alignSelf: "flex-start",
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
});
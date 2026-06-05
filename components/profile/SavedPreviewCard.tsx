import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BRAND_COLOR = "#F5A623";

type Props = {
  title: string;
  subtitle: string;
  location: string;
  image: string;
};

export default function SavedPreviewCard({
  title,
  subtitle,
  location,
  image,
}: Props) {
  return (
    <View style={styles.savedCard}>
      <View>
        <Image source={{ uri: image }} style={styles.savedImage} />
        <TouchableOpacity style={styles.savedBookmark}>
          <Ionicons name="bookmark" size={12} color={BRAND_COLOR} />
        </TouchableOpacity>
      </View>

      <Text style={styles.savedTag}>{subtitle.toUpperCase()}</Text>
      <Text style={styles.savedTitle}>{title}</Text>

      <View style={styles.savedLocationRow}>
        <Ionicons name="location-outline" size={11} color="#888" />
        <Text style={styles.savedLocation}>{location}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  savedCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EFEFEF",
    paddingBottom: 10,
  },
  savedImage: {
    width: "100%",
    height: 120,
  },
  savedBookmark: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  savedTag: {
    marginTop: 8,
    marginHorizontal: 10,
    fontSize: 9,
    color: BRAND_COLOR,
    fontWeight: "700",
  },
  savedTitle: {
    marginTop: 4,
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: "700",
    color: "#222",
  },
  savedLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
    marginHorizontal: 10,
  },
  savedLocation: {
    fontSize: 10,
    color: "#888",
  },
});
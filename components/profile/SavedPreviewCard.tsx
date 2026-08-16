import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BRAND_COLOR = "#F5A623";

type Props = {
  title: string;
  subtitle: string;
  image?: string;
  onPress?: () => void;
};

export default function SavedPreviewCard({
  title,
  subtitle,
  image,
  onPress,
}: Props) {
  return (
    <TouchableOpacity style={styles.savedCard} onPress={onPress} activeOpacity={0.8}>
      <View>
        {image ? <Image source={{ uri: image }} style={styles.savedImage} /> : (
          <View style={styles.savedImagePlaceholder}>
            <Ionicons name="document-text-outline" size={28} color={BRAND_COLOR} />
          </View>
        )}
        <View style={styles.savedBookmark}>
          <Ionicons name="bookmark" size={12} color={BRAND_COLOR} />
        </View>
      </View>

      <Text style={styles.savedTag}>{subtitle.toUpperCase()}</Text>
      <Text style={styles.savedTitle}>{title}</Text>

    </TouchableOpacity>
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
  savedImagePlaceholder: {
    width: "100%",
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8EA",
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
});

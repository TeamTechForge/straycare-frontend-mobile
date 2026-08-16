import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";

type Props = {
  image?: string;
  title?: string;
  likes: number;
  comments: number;
  time: string;
  onPress?: () => void;
};

export default function PostPreviewCard({
  image,
  title = "Community post",
  likes = 0,
  comments = 0,
  time,
  onPress,
}: Props) {
  const formattedTime = time && time.includes("T") ? new Date(time).toLocaleDateString() : (time || "");

  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.8}>
      {image ? <Image source={{ uri: image }} style={styles.postImage} /> : (
        <View style={styles.postPlaceholder}>
          <Ionicons name="document-text-outline" size={34} color="#F5A623" />
          <Text style={styles.placeholderTitle} numberOfLines={2}>{title}</Text>
        </View>
      )}
      <View style={styles.postOverlayBottom}>
        <View style={styles.postMetaLeft}>
          <View style={styles.metaItem}>
            <Ionicons name="heart" size={12} color="#FF6B6B" />
            <Text style={styles.postMetaText}>{likes}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="chatbubble" size={11} color="#fff" />
            <Text style={styles.postMetaText}>{comments}</Text>
          </View>
        </View>
        {formattedTime ? <Text style={styles.postTime}>{formattedTime}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  postCard: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  postImage: {
    width: "100%",
    height: 240,
  },
  postPlaceholder: {
    width: "100%",
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20,
    backgroundColor: "#FFF8EA",
  },
  placeholderTitle: { fontSize: 15, fontWeight: "700", color: "#333", textAlign: "center" },
  postOverlayBottom: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  postMetaLeft: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postMetaText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  postTime: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 11,
    fontWeight: "600",
  },
});

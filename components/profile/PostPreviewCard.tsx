import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";

type Props = {
  image: string;
  likes: number;
  comments: number;
  time: string;
};

export default function PostPreviewCard({
  image,
  likes,
  comments,
  time,
}: Props) {
  return (
    <View style={styles.postCard}>
      <Image source={{ uri: image }} style={styles.postImage} />
      <View style={styles.postOverlayBottom}>
        <View style={styles.postMetaLeft}>
          <View style={styles.metaItem}>
            <Ionicons name="heart" size={11} color="#FFD166" />
            <Text style={styles.postMetaText}>{likes}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="chatbubble" size={10} color="#fff" />
            <Text style={styles.postMetaText}>{comments}</Text>
          </View>
        </View>
        <Text style={styles.postTime}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  postCard: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  postImage: {
    width: "100%",
    height: 240,
  },
  postOverlayBottom: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postMetaLeft: {
    flexDirection: "row",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postMetaText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  postTime: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
});
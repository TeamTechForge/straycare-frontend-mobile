import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const BRAND_COLOR = "#F5A623";

type Props = {
  name: string;
  location: string;
  bio: string;
  memberSince: string;
  avatar: string;
  badgeText?: string;
  onEditPress?: () => void;
};

export default function ProfileHeaderCard({
  name,
  location,
  bio,
  memberSince,
  avatar,
  badgeText = "MEMBER",
  onEditPress,
}: Props) {
  return (
    <View style={styles.profileTop}>
      <View style={styles.avatarOuter}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </View>

      <View style={styles.memberBadge}>
        <Text style={styles.memberBadgeText}>{badgeText}</Text>
      </View>

      <Text style={styles.userName}>{name}</Text>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={12} color="#888" />
        <Text style={styles.locationText}>{location}</Text>
      </View>

      <Text style={styles.bio}>{bio}</Text>

      <Text style={styles.memberSince}>MEMBER SINCE {memberSince}</Text>

      <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileTop: {
    alignItems: "center",
    paddingTop: 8,
  },
  avatarOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: BRAND_COLOR,
    padding: 3,
    backgroundColor: "#FFF4E6",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
  },
  memberBadge: {
    marginTop: -6,
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  memberBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
  },
  userName: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 3,
  },
  locationText: {
    color: "#888",
    fontSize: 12,
  },
  bio: {
    marginTop: 12,
    textAlign: "center",
    color: "#777",
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 14,
  },
  memberSince: {
    marginTop: 10,
    color: BRAND_COLOR,
    fontSize: 10,
    fontWeight: "600",
  },
  editButton: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: BRAND_COLOR,
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 10,
  },
  editButtonText: {
    color: BRAND_COLOR,
    fontSize: 12,
    fontWeight: "600",
  },
});
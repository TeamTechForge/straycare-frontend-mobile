import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ImageViewer from "../ui/ImageViewer";

const BRAND_COLOR = "#F5A623";

type Props = {
  name: string;
  phone?: string;
  location: string;
  bio: string;
  memberSince: string;
  avatar: any;
  onEditPress?: () => void;
  role?: string;
  isVerified?: boolean;
};

export default function ProfileHeaderCard({
  name,
  phone,
  location,
  bio,
  memberSince,
  avatar,
  onEditPress,
  role,
  isVerified,
}: Props) {
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "general_user":
        return "General User";
      case "volunteer":
        return "Volunteer";
      case "vet":
        return "Veterinarian";
      case "ngo":
        return "NGO / Shelter";
      default:
        return "Member";
    }
  };
  return (
    <View style={styles.profileTop}>
      <TouchableOpacity onPress={() => setIsViewerVisible(true)} style={styles.avatarOuter}>
        <Image 
          source={typeof avatar === 'string' ? { uri: avatar } : avatar} 
          style={styles.avatar} 
        />
      </TouchableOpacity>

      <View style={styles.badgeContainer}>
        {role && (
          <View style={[styles.roleBadge, { backgroundColor: role === 'general_user' ? '#888' : BRAND_COLOR }]}>
            <Text style={styles.roleBadgeText}>{getRoleLabel(role)}</Text>
          </View>
        )}
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.userName}>{name}</Text>
        {isVerified && (
          <Ionicons name="checkmark-circle" size={18} color="#1DA1F2" style={{ marginLeft: 4 }} />
        )}
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={12} color="#888" />
        <Text style={styles.locationText}>{location}</Text>
      </View>

      {phone ? (
        <View style={styles.phoneRow}>
          <Ionicons name="call-outline" size={12} color="#888" />
          <Text style={styles.phoneText}>{phone}</Text>
        </View>
      ) : null}

      <Text style={styles.bio}>{bio}</Text>

      <Text style={styles.memberSince}>MEMBER SINCE {memberSince}</Text>

      <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>

      <ImageViewer 
        imageUrl={avatar} 
        visible={isViewerVisible} 
        onClose={() => setIsViewerVisible(false)} 
      />
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

  badgeContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: -6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fff",
  },
  roleBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  userName: {
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
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  phoneText: {
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
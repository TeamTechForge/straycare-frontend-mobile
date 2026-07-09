// components/chat/ChatHeader.tsx
// Header for the chat room screen. Shows back button, user info, online status, and call button.

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND_COLOR = "#F5A623";

type Props = {
  name: string;
  isOnline: boolean;
  profileImage?: string;
  onCallPress?: () => void;
  onTitlePress?: () => void;
};

export default function ChatHeader({ name, isOnline, profileImage, onCallPress, onTitlePress }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#111" />
      </TouchableOpacity>

      {/* Avatar + user info */}
      <TouchableOpacity style={styles.userInfo} onPress={onTitlePress} activeOpacity={0.7}>
        <View style={styles.avatarSmall}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImageSmall} />
          ) : (
            <Ionicons name="person" size={16} color="#999" />
          )}
          {isOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.status}>{isOnline ? "Online" : "Offline"}</Text>
        </View>
      </TouchableOpacity>

      {/* Call button (Phase 2 — visually present, functionality TBD) */}
      <TouchableOpacity onPress={onCallPress} style={styles.callButton}>
        <Ionicons name="call-outline" size={22} color={BRAND_COLOR} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  status: {
    fontSize: 12,
    color: "#22C55E",
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF4E5",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImageSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
});

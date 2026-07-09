// components/chat/MessageBubble.tsx
// Single message bubble with sent/received styling, timestamp, and read receipts.

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View, Linking, TouchableOpacity } from "react-native";

const BRAND_COLOR = "#F5A623";

type Props = {
  text: string;
  time: string;
  isMine: boolean;
  isRead: boolean;
  type?: "text" | "image" | "location";
  imageUrl?: string;
  location?: { latitude: number; longitude: number; address?: string };
  showTail?: boolean;
  onLongPress?: () => void;
  isDeletedForEveryone?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
};

export default function MessageBubble({
  text,
  time,
  isMine,
  isRead,
  type = "text",
  imageUrl,
  location,
  showTail = true,
  onLongPress,
  isDeletedForEveryone = false,
  isSelected = false,
  onPress,
}: Props) {
  return (
    <View style={[styles.row, isMine ? styles.rowRight : styles.rowLeft, isSelected && styles.selectedRow]}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={isDeletedForEveryone ? undefined : onLongPress}
        activeOpacity={0.9}
        delayLongPress={350}
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          showTail && (isMine ? styles.tailRight : styles.tailLeft),
        ]}
      >
        {/* Image message */}
        {type === "image" && imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        )}

        {/* Location message */}
        {type === "location" && location && (
          <TouchableOpacity
            onPress={() => {
              const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
              Linking.openURL(url).catch((err) => console.error("Failed to open maps", err));
            }}
            style={styles.locationContainer}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={20} color={isMine ? "#fff" : BRAND_COLOR} />
            <Text style={[styles.locationText, isMine && styles.textMine]}>
              {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
            </Text>
          </TouchableOpacity>
        )}

        {/* Text content */}
        {(type === "text" || (type === "image" && text)) && (
          <Text
            style={[
              styles.text,
              isMine && styles.textMine,
              isDeletedForEveryone && styles.deletedText,
            ]}
          >
            {text}
          </Text>
        )}

        {/* Footer: time + read receipt */}
        <View style={styles.footer}>
          <Text style={[styles.time, isMine && styles.timeMine]}>{time}</Text>
          {isMine && (
            <Ionicons
              name={isRead ? "checkmark-done" : "checkmark"}
              size={14}
              color={isRead ? "#60A5FA" : isMine ? "rgba(255,255,255,0.6)" : "#999"}
              style={styles.checkmark}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 2,
    paddingHorizontal: 12,
  },
  selectedRow: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  rowRight: {
    alignItems: "flex-end",
  },
  rowLeft: {
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  bubbleMine: {
    backgroundColor: BRAND_COLOR,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  tailRight: {
    borderBottomRightRadius: 4,
  },
  tailLeft: {
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    color: "#222",
    lineHeight: 20,
  },
  textMine: {
    color: "#fff",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    color: "#999",
  },
  timeMine: {
    color: "rgba(255,255,255,0.7)",
  },
  checkmark: {
    marginLeft: 4,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  locationText: {
    fontSize: 13,
    color: "#555",
    flex: 1,
  },
  deletedText: {
    fontStyle: "italic",
    opacity: 0.7,
  },
});

import React from "react";
import { Modal, View, Image, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ImageViewerProps = {
  imageUrl: string | null;
  visible: boolean;
  onClose: () => void;
};

export default function ImageViewer({ imageUrl, visible, onClose }: ImageViewerProps) {
  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.imageViewerContainer}>
        <TouchableOpacity style={styles.imageViewerClose} onPress={onClose}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
        <Image
          source={{ uri: imageUrl }}
          style={styles.imageViewerImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  imageViewerContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerClose: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imageViewerImage: {
    width: "100%",
    height: "80%",
  },
});

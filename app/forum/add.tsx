import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../constants/colors.constants";
import { spacing } from "../../constants/spacing.constants";
import { typography } from "../../constants/typography.constants";
import AppButton from "../../components/ui/AppButton";

const uploadToCloudinary = async (imageUri: string) => {
  const data = new FormData();

  data.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'discussion_forum_image.jpg',
  } as any);

  data.append('upload_preset', 'straycare_report_images');

  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dljp2yzpb/image/upload";

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: data as any,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    const result: any = await response.json();
    return result.secure_url;

  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

export default function AddContent() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library to upload an image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const onPublish = async () => {
    if (!content.trim()) return;

    setUploading(true);
    let finalImageUrl = "";

    if (imageUri) {
      const url = await uploadToCloudinary(imageUri);
      if (url) {
        finalImageUrl = url;
      } else {
        Alert.alert(
          "Upload Failed",
          "Failed to upload the image. Would you like to publish without the image?",
          [
            { text: "Cancel", onPress: () => setUploading(false), style: "cancel" },
            { text: "Publish Anyway", onPress: () => proceedPublish("") }
          ]
        );
        return;
      }
    }

    await proceedPublish(finalImageUrl);
  };

  const proceedPublish = async (imageUrl: string) => {
    setUploading(true);
    try {
      router.push({
        pathname: "/forum/published" as any,
        params: { content: content.trim(), imageUrl },
      });
    } catch (e) {
      Alert.alert("Error", "Could not publish thread.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Add Content</Text>

          {/* Spacer to keep title centered */}
          <View style={{ width: 36 }} />
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.card}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Write your content here..."
              placeholderTextColor="#8A8A8A"
              style={styles.input}
              multiline
              textAlignVertical="top"
            />

            {imageUri ? (
              <View style={{ position: "relative", marginTop: 8, height: 120 }}>
                <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%", borderRadius: 10 }} />
                <TouchableOpacity
                  onPress={() => setImageUri(null)}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: 12,
                    width: 24,
                    height: 24,
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "bold" }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Select Image Button */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 22,
              backgroundColor: "#FFF2D8",
              borderWidth: 1,
              borderColor: "rgba(254,185,75,0.3)"
            }}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Text style={{ fontSize: 16 }}>📷</Text>
            <Text style={{ fontSize: 14, fontFamily: typography.semibold, color: colors.primary }}>
              {imageUri ? "Change Image" : "Add Image"}
            </Text>
          </TouchableOpacity>

          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 12 }} />
          ) : null}

          <AppButton
            title="Publish  ⤴"
            onPress={onPublish}
            disabled={!content.trim() || uploading}
            style={styles.publishBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 28,
    color: colors.text,
    lineHeight: 28,
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.semibold,
    fontSize: 18,
    color: colors.text,
  },

  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },

  card: {
    width: "100%",
    height: 360,
    backgroundColor: "#F7F1E6", // light cream like your figma
    borderRadius: 16,
    padding: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: typography.regular, // Inter
    fontSize: 15,
    color: colors.text,
  },

  publishBtn: {
    marginTop: spacing.xl,
    minWidth: 200,
    borderRadius: 14,
    alignSelf: "center",
  },
});

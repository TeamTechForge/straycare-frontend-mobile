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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Text style={styles.backIcon}>{"\u2190"}</Text>
          </Pressable>

          <Text style={styles.headerTitle}>New Post</Text>

          {/* Spacer to keep title centered */}
          <View style={{ width: 36 }} />
        </View>

        {/* Scrollable Body */}
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  onPress={() => setImageUri(null)}
                  style={styles.removeImageBtn}
                >
                  <Ionicons name="close" size={14} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {/* Select Image Button */}
          <TouchableOpacity
            style={styles.addImageBtn}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="camera-outline" size={18} color={colors.primary} />
            <Text style={styles.addImageText}>
              {imageUri ? "Change Image" : "Add Image"}
            </Text>
          </TouchableOpacity>

          {uploading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 12 }} />
          ) : null}
        </ScrollView>

        {/* Fixed Bottom Publish Button — never covered by keyboard */}
        <View style={styles.bottomBar}>
          <AppButton
            title="Publish"
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
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  backIcon: {
    fontSize: 20,
    color: "#333",
    fontWeight: "700" as const,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: typography.semibold,
    fontSize: 18,
    color: colors.text,
  },

  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: "center",
  },

  card: {
    width: "100%",
    minHeight: 280,
    backgroundColor: "#F7F1E6",
    borderRadius: 16,
    padding: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: typography.regular,
    fontSize: 15,
    color: colors.text,
    minHeight: 200,
  },

  imagePreviewContainer: {
    position: "relative",
    marginTop: 8,
    height: 120,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  removeImageBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  addImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: "#FFF2D8",
    borderWidth: 1,
    borderColor: "rgba(254,185,75,0.3)",
  },
  addImageText: {
    fontSize: 14,
    fontFamily: typography.semibold,
    color: colors.primary,
  },

  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === "ios" ? spacing.md : spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: colors.background,
  },
  publishBtn: {
    minWidth: 200,
    borderRadius: 14,
    alignSelf: "center",
  },
});

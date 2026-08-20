import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createCommunityPost } from "../../services/communityService";
import PrimaryButton from "../../components/PrimaryButton";
import BackButton from "../../components/BackButton";
import { colors } from "../../constants/colors.constants";

// ── Category options ─────────────────────────────────────────────────────────
const CATEGORIES = [
  "Pet Care Tips",
  "Health & First Aid",
  "Stray Animal Help",
  "Training & Behavior",
  "Animal Welfare & Rights Awareness",
  "Success Stories",
  "Events & Campaigns",
];

// ── Validation ───────────────────────────────────────────────────────────────
function validateForm(
  title: string,
  content: string
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!title.trim()) {
    errors.title = "Please fill in the post title.";
  } else if (title.trim().length < 5) {
    errors.title = "Title must be at least 5 characters.";
  }

  if (!content.trim()) {
    errors.content = "Please fill in the post content.";
  } else if (content.trim().length < 20) {
    errors.content = "Content must be at least 20 characters.";
  }

  return errors;
}

export default function CreateCommunityPost() {
  const router = useRouter();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Pet Care Tips");

  // Image state
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Image picker ────────────────────────────────────────────────────────────
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library to upload an image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [5, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => setImageUri(null);

  // ── Blur handler ────────────────────────────────────────────────────────────
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateForm(title, content));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Mark all fields touched so all errors become visible
    setTouched({ title: true, content: true });

    const newErrors = validateForm(title, content);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      // Build FormData — sends image as real file, not a string path
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("category", selectedCategory);
      formData.append("content", content.trim());

      // Only attach image if the user picked one
      if (imageUri) {
        const filename = imageUri.split("/").pop() ?? "photo.jpg";
        const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
        const mimeType = ext === "png" ? "image/png" : "image/jpeg";

        formData.append("image", {
          uri: imageUri,
          name: filename,
          type: mimeType,
        } as any);
      }

      const savedPost = await createCommunityPost(formData);

      // createCommunityPost already unwraps the response —
      // it returns the saved post object directly.
      if (savedPost && savedPost._id) {
        router.replace("/community-feed/CommunityPostMain");
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } catch (error: any) {
      console.log("Submit error:", error?.response?.data || error);
      const serverMessage = error?.response?.data?.message || error?.message;
      Alert.alert(
        "Error",
        serverMessage || "Failed to submit post. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: only show error if the field has been touched
  const showError = (field: string) => touched[field] && errors[field];

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Create Community Post</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ── Scrollable Form Body ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.requiredNote}>Fields marked with <Text style={styles.required}>*</Text> are required.</Text>
        {/* ── Post Title ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Post Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, showError("title") && styles.inputError]}
            placeholder="Enter the title of the post"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (touched.title) setErrors(validateForm(text, content));
            }}
            onBlur={() => handleBlur("title")}
          />
          {showError("title") && (
            <Text style={styles.errorText}>{errors.title}</Text>
          )}
        </View>

        {/* ── Category Chips ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Category <Text style={styles.required}>*</Text></Text>
          <View style={styles.chipsContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  selectedCategory === cat && styles.chipActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedCategory === cat && styles.chipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Post Content ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Post Content <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              showError("content") && styles.inputError,
            ]}
            placeholder="Enter the content of the post"
            placeholderTextColor="#94a3b8"
            value={content}
            onChangeText={(text) => {
              setContent(text);
              if (touched.content) setErrors(validateForm(title, text));
            }}
            onBlur={() => handleBlur("content")}
            multiline
            scrollEnabled={false}
            textAlignVertical="top"
          />
          {showError("content") && (
            <Text style={styles.errorText}>{errors.content}</Text>
          )}
          <Text style={styles.charCount}>{content.length} characters</Text>
        </View>

        {/* ── Upload Photo (Optional) ── */}
        <View style={styles.section}>
          <Text style={styles.label}>Upload a Photo (Optional)</Text>

          {imageUri ? (
            // ── Filled state: full image preview ──
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              {/* Badge bottom-left */}
              <View style={styles.imageBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                <Text style={styles.imageBadgeText}>Image added</Text>
              </View>
              {/* Remove button top-right */}
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="close-circle" size={28} color="#eab308" />
              </TouchableOpacity>
            </View>
          ) : (
            // ── Empty state: upload prompt ──
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={handlePickImage}
            >
              <View style={styles.uploadIconCircle}>
                <Ionicons name="camera-outline" size={24} color="#eab308" />
              </View>
              <Text style={styles.uploadPrimary}>Tap to upload animal photo</Text>
              <Text style={styles.uploadSecondary}>PNG, JPG up to 10MB</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Vertical Spacer ── */}
        <View style={styles.spacer} />

        {/* ── Action Buttons ── */}
        <View style={styles.actionsSection}>
          <PrimaryButton title={isSubmitting ? "Submitting..." : "Submit Post"} onPress={handleSubmit} disabled={isSubmitting} />

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  requiredNote: { fontSize: 12, color: "#64748b", marginBottom: 8 },
  required: { color: colors.error, fontWeight: "700" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    fontSize: 14,
    color: "#1f2937",
  },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 1.5,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "500",
  },
  charCount: {
    marginTop: 4,
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "right",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  chipActive: {
    backgroundColor: "#f5c542",
    borderColor: "#f5c542",
  },
  chipText: {
    fontSize: 13,
    color: "#475569",
  },
  chipTextActive: {
    color: "#000000",
    fontWeight: "600",
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fef9c3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadPrimary: {
    fontSize: 14,
    fontWeight: "500",
    color: "#334155",
  },
  uploadSecondary: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  imagePreviewContainer: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    gap: 4,
  },
  imageBadgeText: {
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "600",
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ffffff",
    borderRadius: 9999,
  },
  spacer: {
    height: 48,
  },
  actionsSection: {
    gap: 12,
  },
  cancelButton: {
    width: "100%",
    paddingVertical: 16,
    backgroundColor: "#f0f4f8",
    borderRadius: 9999,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#475569",
  },
});

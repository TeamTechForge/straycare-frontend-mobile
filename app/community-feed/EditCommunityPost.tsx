import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getApiErrorMessage, getCommunityPost, updateCommunityPost } from "../../services/communityService";
import PrimaryButton from "../../components/PrimaryButton";
import BackButton from "../../components/BackButton";
import { colors } from "../../constants/colors.constants";

import { appendImageToFormData, COMMUNITY_POST_CATEGORIES } from "../../utils/communityPost.utils";

export default function EditCommunityPost() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>(COMMUNITY_POST_CATEGORIES[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [replacementImageUri, setReplacementImageUri] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCommunityPost(id).then((post) => {
      if (!post.isOwner) throw new Error("Only the post owner may edit this post");
      setTitle(post.title || "");
      setContent(post.content || "");
      setCategory(post.category || COMMUNITY_POST_CATEGORIES[0]);
      setCurrentImageUrl(post.imageUrl || null);
    }).catch((error: unknown) => {
      Alert.alert("Unable to edit post", getApiErrorMessage(error, "Please try again."));
      router.back();
    }).finally(() => setLoading(false));
  }, [id, router]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo-library access to select an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [5, 4], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setReplacementImageUri(result.assets[0].uri);
      setImageRemoved(false);
    }
  };

  const handleRemoveImage = () => {
    setReplacementImageUri(null);
    setImageRemoved(true);
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (trimmedTitle.length < 5 || trimmedContent.length < 20) {
      Alert.alert("Check your post", "Title must have at least 5 characters and content at least 20 characters.");
      return;
    }
    if (!id) return;
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append("title", trimmedTitle);
      formData.append("category", category);
      formData.append("content", trimmedContent);
      if (replacementImageUri) {
        appendImageToFormData(formData, replacementImageUri);
      } else if (imageRemoved) {
        // Tell the backend to remove the existing image when no replacement was chosen.
        formData.append("removeImage", "true");
      }
      await updateCommunityPost(id, formData);
      router.replace({ pathname: "/community-feed/CommunityPostView", params: { id } });
    } catch (error: unknown) {
      Alert.alert("Unable to update post", getApiErrorMessage(error, "Please try again."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#F28C28" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Edit Post</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.requiredNote}>Fields marked with <Text style={styles.required}>*</Text> are required.</Text>
        <Text style={styles.label}>Post Title <Text style={styles.required}>*</Text></Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />
        <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
        <View style={styles.chips}>{COMMUNITY_POST_CATEGORIES.map((item) => (
          <TouchableOpacity key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}>
            <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}</View>
        <Text style={styles.label}>Post Content <Text style={styles.required}>*</Text></Text>
        <TextInput style={[styles.input, styles.textArea]} value={content} onChangeText={setContent} multiline scrollEnabled={false} textAlignVertical="top" />
        <Text style={styles.label}>Post Image (Optional)</Text>
        {(replacementImageUri || (!imageRemoved && currentImageUrl)) ? (
          <View style={styles.imageWrap}>
            <Image source={{ uri: replacementImageUri || currentImageUrl! }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeImage} onPress={handleRemoveImage}>
              <Ionicons name="close-circle" size={30} color={colors.error} />
            </TouchableOpacity>
          </View>
        ) : <View style={styles.noImage}><Ionicons name="image-outline" size={28} color="#94a3b8" /><Text style={styles.noImageText}>No image selected</Text></View>}
        <TouchableOpacity style={styles.pickImage} onPress={handlePickImage}>
          <Ionicons name="camera-outline" size={20} color={colors.primary} />
          <Text style={styles.pickImageText}>{replacementImageUri ? "Change replacement image" : "Select image"}</Text>
        </TouchableOpacity>
        <PrimaryButton title={saving ? "Saving..." : "Save Changes"} onPress={handleSave} disabled={saving} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" }, center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: "#1f2937" },
  content: { padding: 24, paddingBottom: 48 }, label: { fontSize: 13, fontWeight: "600", color: "#334155", marginBottom: 8, marginTop: 20 },
  input: { width: "100%", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", fontSize: 14, color: "#1f2937" },
  textArea: { minHeight: 120, paddingTop: 14 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: "#e2e8f0" },
  chipActive: { backgroundColor: "#f5c542", borderColor: "#f5c542" }, chipText: { fontSize: 13, color: "#475569" }, chipTextActive: { color: "#000", fontWeight: "600" },
  requiredNote: { fontSize: 12, color: "#64748b", marginBottom: 4 }, required: { color: colors.error, fontWeight: "700" },
  imageWrap: { width: "100%", height: 200, borderRadius: 16, overflow: "hidden" }, previewImage: { width: "100%", height: "100%" },
  removeImage: { position: "absolute", top: 8, right: 8, backgroundColor: "#fff", borderRadius: 20 },
  noImage: { height: 110, borderWidth: 1, borderStyle: "dashed", borderColor: "#cbd5e1", borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 6 },
  noImageText: { color: "#94a3b8", fontSize: 12 }, pickImage: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, marginVertical: 10 },
  pickImageText: { color: "#475569", fontSize: 14, fontWeight: "600" },
});

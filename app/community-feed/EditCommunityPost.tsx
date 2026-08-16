import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getCommunityPost, updateCommunityPost } from "../../services/communityService";

const CATEGORIES = [
  "Pet Care Tips", "Health & First Aid", "Stray Animal Help", "Training & Behavior",
  "Animal Welfare & Rights Awareness", "Success Stories", "Events & Campaigns",
];

export default function EditCommunityPost() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCommunityPost(id).then((post) => {
      if (!post.isOwner) throw new Error("Only the post owner may edit this post");
      setTitle(post.title || "");
      setContent(post.content || "");
      setCategory(post.category || CATEGORIES[0]);
    }).catch((error) => {
      Alert.alert("Unable to edit post", error?.response?.data?.message || error.message);
      router.back();
    }).finally(() => setLoading(false));
  }, [id, router]);

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
      await updateCommunityPost(id, { title: trimmedTitle, category, content: trimmedContent });
      router.replace({ pathname: "/community-feed/CommunityPostView", params: { id } });
    } catch (error: any) {
      Alert.alert("Unable to update post", error?.response?.data?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#F28C28" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Community Post</Text><View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Post Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />
        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>{CATEGORIES.map((item) => (
          <TouchableOpacity key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}>
            <Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}</View>
        <Text style={styles.label}>Post Content</Text>
        <TextInput style={[styles.input, styles.textArea]} value={content} onChangeText={setContent} multiline scrollEnabled={false} textAlignVertical="top" />
        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} disabled={saving} onPress={handleSave}>
          {saving ? <ActivityIndicator color="#1f2937" /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
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
  saveButton: { marginTop: 32, paddingVertical: 16, backgroundColor: "#f5c542", borderRadius: 999, alignItems: "center" }, saveText: { fontSize: 16, fontWeight: "700", color: "#1f2937" },
});

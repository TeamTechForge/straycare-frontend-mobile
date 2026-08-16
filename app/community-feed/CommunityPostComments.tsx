import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import BackButton from "../../components/BackButton";

import CommentComposer from "../../components/forum/CommentComposer";
import {
  CommunityComment,
  createCommunityComment,
  getCommunityComments,
} from "../../services/communityService";

const BRAND_COLOR = "#F28C28";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function CommunityPostComments() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const loadComments = useCallback(async () => {
    if (!id) {
      setError(true);
      setLoading(false);
      return;
    }

    try {
      setError(false);
      const result = await getCommunityComments(id);
      setComments(result.comments);
    } catch (loadError) {
      console.error("Load community comments error:", loadError);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadComments();
    }, [loadComments])
  );

  const handleSend = async (text: string): Promise<boolean> => {
    const content = text.trim();
    if (!id || !content || submitting) return false;

    try {
      setSubmitting(true);
      const result = await createCommunityComment(id, content);
      setComments((current) => [...current, result.comment]);
      return true;
    } catch (submitError: any) {
      console.error("Create community comment error:", submitError);
      Alert.alert(
        "Unable to add comment",
        submitError?.response?.data?.message || "Please try again."
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={BRAND_COLOR} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={38} color="#7F7665" />
            <Text style={styles.stateText} onPress={() => void loadComments()}>
              Failed to load comments. Tap to retry.
            </Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            keyExtractor={(item) => item._id}
            contentContainerStyle={comments.length ? styles.list : styles.emptyList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                {item.profileImage ? (
                  <Image source={{ uri: item.profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Ionicons name="person" size={18} color="#7F7665" />
                  </View>
                )}
                <View style={styles.commentBody}>
                  <View style={styles.commentMeta}>
                    <Text style={styles.username}>{item.username}</Text>
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.content}>{item.content}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Ionicons name="chatbubbles-outline" size={40} color="#7F7665" />
                <Text style={styles.stateText}>No comments yet. Start the conversation.</Text>
              </View>
            }
          />
        )}

        <View style={[styles.composer, submitting && styles.composerDisabled]}>
          <CommentComposer onSend={handleSend} disabled={submitting} multiline />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#D1C5B220",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: "#121C2C" },
  headerSpacer: { width: 26 },
  list: { padding: 16, gap: 14 },
  emptyList: { flexGrow: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
  stateText: { color: "#7F7665", fontSize: 14, textAlign: "center" },
  commentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0DD",
  },
  commentBody: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D1C5B230",
  },
  commentMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  username: { flex: 1, fontSize: 13, fontWeight: "700", color: "#121C2C" },
  date: { fontSize: 10, color: "#7F7665" },
  content: { marginTop: 6, fontSize: 14, lineHeight: 20, color: "#4D4637" },
  composer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#D1C5B220",
  },
  composerDisabled: { opacity: 0.6 },
});

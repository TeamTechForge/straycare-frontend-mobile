import React, { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import AppButton from "../../components/ui/AppButton";
import PublishedCard from "../../components/thread/PublishedCard";
import { styles } from "../../styles/thread-published.styles";
import { createPost } from "../../services/forumService";

export default function ThreadPublished() {
  const router = useRouter();
  const params = useLocalSearchParams<{ content?: string; imageUrl?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const publish = async () => {
      const content = String(params.content ?? "").trim();

      if (!content) {
        console.error("[ThreadPublished] No content provided");
        setError("No post content was provided.");
        setLoading(false);
        return;
      }

      try {
        console.log("[ThreadPublished] ========== Publishing post ==========");
        console.log("[ThreadPublished] Content:", content.substring(0, 100));
        
        const result = await createPost({ title: content, imageUrl: params.imageUrl });
        
        console.log("[ThreadPublished] Post created successfully");
        console.log("[ThreadPublished] Post ID:", result.post.id);
        setError(null);
        setSuccess(true);
      } catch (publishError) {
        const message = publishError instanceof Error ? publishError.message : "Failed to publish post";
        console.error("[ThreadPublished] ERROR publishing post:", message, publishError);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void publish();
  }, [params.content]);

  const goToForum = () => {
    try {
      router.replace("/forum" as any);
    } catch (err) {
      router.push("/forum" as any);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        {loading ? (
          <View style={{ alignItems: "center", gap: 16 }}>
            <ActivityIndicator size="large" />
            <Text>Publishing to the forum...</Text>
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", gap: 16 }}>
            <Text style={{ color: "#B00020", textAlign: "center", fontWeight: "600" }}>
              Failed to publish
            </Text>
            <Text style={{ color: "#666", textAlign: "center", marginBottom: 12 }}>
              {error}
            </Text>
            <AppButton title="Go back" onPress={() => router.back()} style={styles.doneBtn} />
          </View>
        ) : (
          <>
            <PublishedCard />
            <AppButton title="Done" onPress={goToForum} style={styles.doneBtn} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
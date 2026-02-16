import React, { useMemo, useState } from "react";
import { SafeAreaView, View, ScrollView, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { THREADS } from "../../data/threadData";
import { ThreadData, ThreadMessage } from "../../types/thread";
import { threadStyles as styles } from "../../styles/thread.styles";

import ThreadHeaderCard from "../../components/thread/ThreadHeaderCard";
import ThreadMessageCard from "../../components/thread/ThreadMessageCard";
import ThreadComposer from "../../components/thread/ThreadComposer";
import ThreadBottomBar from "../../components/thread/ThreadBottomBar";

export default function DiscussionThreadScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const initialThread = useMemo<ThreadData>(() => {
    return THREADS[id ?? "p1"] ?? THREADS["p1"];
  }, [id]);

  const [thread, setThread] = useState<ThreadData>(initialThread);

  function toggleMessageLike(messageId: string) {
    setThread((prev) => ({
      ...prev,
      messages: prev.messages.map((m) => {
        if (m.id !== messageId) return m;
        const nextLiked = !m.likedByMe;
        return {
          ...m,
          likedByMe: nextLiked,
          likes: nextLiked ? m.likes + 1 : Math.max(0, m.likes - 1),
        };
      }),
    }));
  }

  function addReply(text: string) {
    const clean = text.trim();
    if (!clean) return;

    const newMsg: ThreadMessage = {
      id: `m${Date.now()}`,
      name: "You",
      role: "NGO",
      subtitle: "Community Member",
      time: "JUST NOW",
      text: clean,
      likes: 0,
      likedByMe: false,
    };

    setThread((prev) => ({ ...prev, messages: [...prev.messages, newMsg] }));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Text style={styles.pageTitle}>Discussion Thread</Text>

        <ThreadHeaderCard title={thread.title} likes={thread.likes} />

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {thread.messages.map((m) => (
            <ThreadMessageCard
              key={m.id}
              message={m}
              onToggleLike={() => toggleMessageLike(m.id)}
            />
          ))}
        </ScrollView>

        <ThreadComposer onSend={addReply} />

        <ThreadBottomBar onClose={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

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

  // get thread id from route
  const { id } = useLocalSearchParams<{ id: string }>();

  // find thread using id (if not found use default)
  const initialThread = useMemo<ThreadData>(() => {
    return THREADS[id ?? "p1"] ?? THREADS["p1"];
  }, [id]);

  // store thread data in state
  const [thread, setThread] = useState<ThreadData>(initialThread);

  // like / unlike a message
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

  // add new reply
  function addReply(text: string) {
    const clean = text.trim();
    if (!clean) return; // don't add empty reply

    const newMsg: ThreadMessage = {
      id: `m${Date.now()}`, // simple id
      name: "You",
      role: "NGO",
      subtitle: "Community Member",
      time: "JUST NOW",
      text: clean,
      likes: 0,
      likedByMe: false,
    };

    // add message to end
    setThread((prev) => ({ ...prev, messages: [...prev.messages, newMsg] }));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        {/* page title */}
        <Text style={styles.pageTitle}>Discussion Thread</Text>

        {/* thread header */}
        <ThreadHeaderCard title={thread.title} likes={thread.likes} />

        {/* message list */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {thread.messages.map((m) => (
            <ThreadMessageCard
              key={m.id}
              message={m}
              onToggleLike={() => toggleMessageLike(m.id)}
            />
          ))}
        </ScrollView>

        {/* reply input box */}
        <ThreadComposer onSend={addReply} />

        {/* bottom close button */}
        <ThreadBottomBar onClose={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

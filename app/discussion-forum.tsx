import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, ScrollView, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { forumStyles as styles } from "../styles/forum.styles";
import ForumTabs from "../components/forum/ForumTabs";
import ForumPostCard, { ForumPost } from "../components/forum/ForumPostCard";
import ForumBottomActions from "../components/forum/ForumBottomActions";

type TabKey = "Newest" | "Active" | "Unanswered";

const INITIAL_POSTS: ForumPost[] = [
  {
    id: "p1",
    title: "Cat not moving after fall, advice needed immediately",
    tag: "GENERAL",
    time: "7h ago",
    author: "Sahan_ya",
    likes: 2,
    likedByMe: false,
    comments: ["Please take to a vet ASAP"],
  },
  {
    id: "p2",
    title: "Best wet food brands for sensitive stomachs?",
    tag: "HEALTH",
    time: "1d ago",
    author: "Nimal_09",
    likes: 5,
    likedByMe: true,
    comments: ["Try grain-free food"],
  },
];

export default function DiscussionForumScreen() {
  const router = useRouter();

  // ✅ read the new post text sent from "Done" button screen
  const params = useLocalSearchParams<{ newPost?: string }>();

  const [tab, setTab] = useState<TabKey>("Newest");
  const [posts, setPosts] = useState<ForumPost[]>(INITIAL_POSTS);

  // ✅ add the new post to the top when we come back with params
  useEffect(() => {
    if (!params.newPost) return;

    const text = String(params.newPost).trim();
    if (!text) return;

    // prevent duplicate insert if route re-renders with same param
    setPosts((prev) => {
      const alreadyAdded = prev.some((p) => p.title === text && p.author === "You");
      if (alreadyAdded) return prev;

      const newItem: ForumPost = {
        id: Date.now().toString(),
        title: text,
        tag: "GENERAL",
        time: "Just now",
        author: "You",
        likes: 0,
        likedByMe: false,
        comments: [],
      };

      return [newItem, ...prev];
    });
  }, [params.newPost]);

  const filtered = useMemo(() => {
    if (tab === "Newest") return posts;
    if (tab === "Active")
      return [...posts].sort((a, b) => b.comments.length - a.comments.length);
    return posts.filter((p) => p.comments.length === 0);
  }, [tab, posts]);

  function toggleLike(id: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likes: p.likedByMe ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Text style={styles.title}>Discussion Forum</Text>

        <ForumTabs tab={tab} onChange={setTab} />

        <ScrollView style={styles.list}>
          {filtered.map((post) => (
            <ForumPostCard
              key={post.id}
              post={post}
              onToggleLike={() => toggleLike(post.id)}
            />
          ))}
        </ScrollView>

        <ForumBottomActions onClose={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

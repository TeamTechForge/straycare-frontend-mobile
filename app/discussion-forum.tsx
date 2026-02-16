import React, { useMemo, useState } from "react";
import { SafeAreaView, View, ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";

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
  const [tab, setTab] = useState<TabKey>("Newest");
  const [posts, setPosts] = useState<ForumPost[]>(INITIAL_POSTS);

  const filtered = useMemo(() => {
    if (tab === "Newest") return posts;
    if (tab === "Active") return [...posts].sort((a, b) => b.comments.length - a.comments.length);
    return posts.filter((p) => p.comments.length === 0);
  }, [tab, posts]);

  function toggleLike(id: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, likedByMe: !p.likedByMe, likes: p.likedByMe ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  }

  function addComment(id: string, text: string) {
    if (!text.trim()) return;
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, comments: [...p.comments, text] } : p))
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

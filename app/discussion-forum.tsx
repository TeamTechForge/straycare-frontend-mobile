import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, ScrollView, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { forumStyles as styles } from "../styles/forum.styles";
import ForumTabs from "../components/forum/ForumTabs";
import ForumPostCard, { ForumPost } from "../components/forum/ForumPostCard";
import ForumBottomActions from "../components/forum/ForumBottomActions";

// three tab types
type TabKey = "Newest" | "Active" | "Unanswered";

// starting posts (dummy data)
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

  // get the post text from previous screen
  const params = useLocalSearchParams<{ newPost?: string }>();

  // default tab is Newest
  const [tab, setTab] = useState<TabKey>("Newest");

  // store all posts here
  const [posts, setPosts] = useState<ForumPost[]>(INITIAL_POSTS);

  // when user comes back after creating post, add it to top
  useEffect(() => {
    if (!params.newPost) return;

    const text = String(params.newPost).trim();
    if (!text) return;

    setPosts((prev) => {
      // avoid adding same post again
      const alreadyAdded = prev.some(
        (p) => p.title === text && p.author === "You"
      );
      if (alreadyAdded) return prev;

      const newItem: ForumPost = {
        id: Date.now().toString(), // simple id using time
        title: text,
        tag: "GENERAL",
        time: "Just now",
        author: "You",
        likes: 0,
        likedByMe: false,
        comments: [],
      };

      // add new post at top
      return [newItem, ...prev];
    });
  }, [params.newPost]);

  // filter posts based on selected tab
  const filtered = useMemo(() => {
    if (tab === "Newest") return posts;

    // Active = most comments first
    if (tab === "Active")
      return [...posts].sort(
        (a, b) => b.comments.length - a.comments.length
      );

    // Unanswered = no comments
    return posts.filter((p) => p.comments.length === 0);
  }, [tab, posts]);

  // like button logic
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
        {/* screen heading */}
        <Text style={styles.title}>Discussion Forum</Text>

        {/* tab buttons */}
        <ForumTabs tab={tab} onChange={setTab} />

        {/* list of posts */}
        <ScrollView style={styles.list}>
          {filtered.map((post) => (
            <ForumPostCard
              key={post.id}
              post={post}
              onToggleLike={() => toggleLike(post.id)}
            />
          ))}
        </ScrollView>

        {/* bottom actions like close */}
        <ForumBottomActions onClose={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

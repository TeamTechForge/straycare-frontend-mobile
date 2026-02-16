import { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import type { ForumPost } from "../types/forum";

export function useAppendPostFromParams(
  setPosts: React.Dispatch<React.SetStateAction<ForumPost[]>>
) {
  const params = useLocalSearchParams<{ newPost?: string }>();

  useEffect(() => {
    if (!params.newPost) return;

    const text = String(params.newPost).trim();
    if (!text) return;

    setPosts((prev) => [
      {
        id: Date.now().toString(),
        title: text,
        tag: "GENERAL",
        time: "Just now",
        author: "You",
        likes: 0,
        likedByMe: false,
        comments: [],
      },
      ...prev,
    ]);
  }, [params.newPost, setPosts]);
}

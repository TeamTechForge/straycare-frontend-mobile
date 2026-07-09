export type ForumPostTag = "GENERAL" | "HEALTH";

export type ForumPost = {
  id: string;
  title: string;
  tag: ForumPostTag;
  author: string;
  likes: number;
  likedByMe: boolean;
  commentCount: number;
  createdAt?: string;
};

export type ForumThreadComment = {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
};

export type ForumThread = {
  rescueId: string;
  comments: ForumThreadComment[];
};

export type ForumThreadResponse = ForumThread;

export type ForumPostTag = "GENERAL" | "HEALTH";

export type ForumPost = {
  id: string;
  title: string;
  tag: ForumPostTag;
  author: string;
  likes: number;
  likedByMe: boolean;
  isMine?: boolean;
  commentCount: number;
  imageUrl?: string;
  createdAt?: string;
};

export type ForumThreadComment = {
  id: string;
  userId: string;
  userName?: string;
  isMine?: boolean;
  text: string;
  timestamp: string;
};

export type ForumThread = {
  rescueId: string;
  comments: ForumThreadComment[];
};

export type ForumThreadResponse = ForumThread;

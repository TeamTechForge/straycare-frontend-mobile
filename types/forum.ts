export type ForumPost = {
  id: string;
  title: string;
  tag: "GENERAL" | "HEALTH";
  time: string;
  author: string;
  likes: number;
  likedByMe: boolean;
  comments: string[];
};

export type Role = "Vet" | "NGO" | "";

export type ThreadMessage = {
  id: string;
  name: string;
  role?: Role;
  subtitle: string;
  time: string;
  text: string;
  likes: number;
  likedByMe: boolean;
};

export type ThreadData = {
  id: string;
  title: string;
  likes: number;
  messages: ThreadMessage[];
};

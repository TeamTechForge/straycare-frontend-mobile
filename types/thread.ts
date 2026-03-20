// user role type
export type Role = "Vet" | "NGO";

// single message inside thread
export type ThreadMessage = {
  id: string;          // message id
  name: string;        // sender name
  role: Role;          // sender role
  subtitle: string;    // small extra text under name
  time: string;        // message time
  text: string;        // actual message
  likes: number;       // total likes
  likedByMe: boolean;  // check if current user liked
};

// full thread data
export type ThreadData = {
  id: string;                    // thread id
  title: string;                 // thread title
  likes: number;                 // total likes for thread
  messages: ThreadMessage[];     // all messages inside thread
};

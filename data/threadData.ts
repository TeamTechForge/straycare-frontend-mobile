import { ThreadData } from "../types/thread";

export const THREADS: Record<string, ThreadData> = {
  p1: {
    id: "p1",
    title: "Cat not moving after fall, advice needed immediately",
    likes: 12,
    messages: [
      {
        id: "m1",
        name: "Dr. Jhone",
        role: "Vet",
        subtitle: "Veterinary Specialist",
        time: "1 DAY AGO",
        text:
          "Please do not try to move the cat manually. If there is a spinal injury, moving it could make it worse. Keep it warm and wait for the rescuer.",
        likes: 4,
        likedByMe: false,
      },
      {
        id: "m2",
        name: "Mike",
        role: "NGO",
        subtitle: "Field Responder",
        time: "2 DAYS AGO",
        text:
          "I saw your report. I’m 10 minutes away with a transport crate. Please keep the area quiet so the cat stays calm.",
        likes: 2,
        likedByMe: false,
      },
    ],
  },
};

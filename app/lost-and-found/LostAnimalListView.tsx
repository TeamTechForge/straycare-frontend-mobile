import React from "react";
import BaseAnimalListView from "./BaseAnimalListView";
import { getLostPosts } from "../../services/lostAndFoundService";

export default function LostAnimalScreen() {
  return (
    <BaseAnimalListView
      mode="lost"
      fetchPostsFn={getLostPosts}
      badgeLabel="LOST"
      badgeTextColor="#9b4500"
    />
  );
}

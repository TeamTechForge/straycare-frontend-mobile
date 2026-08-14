import React from "react";
import BaseAnimalListView from "./BaseAnimalListView";
import { getFoundPosts } from "../../services/lostAndFoundService";

export default function FoundAnimalScreen() {
  return (
    <BaseAnimalListView
      mode="found"
      fetchPostsFn={getFoundPosts}
      badgeLabel="FOUND"
      badgeTextColor="#9b9800"
    />
  );
}

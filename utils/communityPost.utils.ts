export const COMMUNITY_POST_CATEGORIES = [
  "Pet Care Tips",
  "Health & First Aid",
  "Stray Animal Help",
  "Training & Behavior",
  "Animal Welfare & Rights Awareness",
  "Success Stories",
  "Events & Campaigns",
] as const;

export type CommunityPostFormField = "title" | "content";
export type CommunityPostFormErrors = Partial<
  Record<CommunityPostFormField, string>
>;

// Create and edit screens share these rules so both flows accept the same input.
export function validateCommunityPost(
  title: string,
  content: string
): CommunityPostFormErrors {
  const errors: CommunityPostFormErrors = {};

  if (!title.trim()) {
    errors.title = "Please fill in the post title.";
  } else if (title.trim().length < 5) {
    errors.title = "Title must be at least 5 characters.";
  }

  if (!content.trim()) {
    errors.content = "Please fill in the post content.";
  } else if (content.trim().length < 20) {
    errors.content = "Content must be at least 20 characters.";
  }

  return errors;
}

export function appendImageToFormData(formData: FormData, imageUri: string): void {
  const filename = imageUri.split("/").pop() ?? "photo.jpg";
  const extension = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const imageFile = {
    uri: imageUri,
    name: filename,
    type: extension === "png" ? "image/png" : "image/jpeg",
  };

  // React Native accepts this URI-based file object even though DOM typings expect Blob.
  formData.append("image", imageFile as unknown as Blob);
}

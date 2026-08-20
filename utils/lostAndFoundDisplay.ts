const UNKNOWN_ANIMAL_NAMES = new Set([
  "unknown",
  "unknown name",
]);

export const getDisplayAnimalName = (value?: string | null): string | null => {
  const trimmedValue = value?.trim();

  if (!trimmedValue || UNKNOWN_ANIMAL_NAMES.has(trimmedValue.toLowerCase())) {
    return null;
  }

  return trimmedValue;
};

export const getAnimalPostTitle = (
  breed?: string | null,
  name?: string | null,
): string | null => {
  const displayBreed = breed?.trim() || null;
  const displayName = getDisplayAnimalName(name);

  return [displayBreed, displayName].filter(Boolean).join(" - ") || null;
};

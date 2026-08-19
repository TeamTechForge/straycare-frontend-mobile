// constants/breeds.constants.ts

export type AnimalCategory = "Dog" | "Cat" | "Other";

export const ANIMAL_BREEDS: Record<"Dog" | "Cat", string[]> = {
  Dog: [
    "Labrador Retriever",
    "German Shepherd",
    "Golden Retriever",
    "French Bulldog",
    "Poodle",
    "Beagle",
    "Bulldog",
    "Rottweiler",
    "Yorkshire Terrier",
    "Doberman",
    "Husky",
    "Unknown Breed",
    "Other",
  ],
  Cat: [
    "Persian",
    "Siamese",
    "Bengal",
    "Maine Coon",
    "Ragdoll",
    "Sphynx",
    "British Shorthair",
    "Scottish Fold",
    "American Shorthair",
    "Abyssinian",
    "Unknown Breed",
    "Other",
  ],
};

export default ANIMAL_BREEDS;

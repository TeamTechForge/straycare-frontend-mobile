import { ANIMAL_BREEDS, AnimalCategory } from "../../constants/breeds.constants";

export type AdoptionCategory = AnimalCategory;
export type AdoptionGender = "Male" | "Female";
export type AdoptionStatus = "Available" | "Pending" | "Adopted";
export type AdoptionHealthStatus =
  | "Healthy"
  | "Needs Care"
  | "Under Treatment"
  | "Special Needs";

export type AdoptionFormErrors = {
  name?: string;
  age?: string;
  description?: string;
  customCategory?: string;
  breed?: string;
  otherBreed?: string;
  location?: string;
  images?: string;
};

type ValidationValues = {
  name: string;
  age: string;
  description: string;
  category: AdoptionCategory;
  customCategory: string;
  breed: string;
  otherBreed: string;
  location: string;
  hasSelectedRegion: boolean;
  requireImage?: boolean;
  imageCount?: number;
  emptyDescriptionMessage: string;
};

export const BREEDS_BY_CATEGORY = ANIMAL_BREEDS;
export const GENDERS: AdoptionGender[] = ["Male", "Female"];
export const STATUSES: AdoptionStatus[] = ["Available", "Pending", "Adopted"];
export const HEALTH_STATUSES: AdoptionHealthStatus[] = [
  "Healthy",
  "Needs Care",
  "Under Treatment",
  "Special Needs",
];
export const TRAITS = [
  "Vaccinated",
  "Neutered",
  "Microchipped",
  "House trained",
  "Good with kids",
  "Good with pets",
];

const VALID_AGE = /^\d+(\s*(year|years|month|months|week|weeks))?$/i;

export function validateAdoptionForm({
  name,
  age,
  description,
  category,
  customCategory,
  breed,
  otherBreed,
  location,
  hasSelectedRegion,
  requireImage = false,
  imageCount = 0,
  emptyDescriptionMessage,
}: ValidationValues): AdoptionFormErrors {
  const errors: AdoptionFormErrors = {};

  if (!name.trim()) errors.name = "Pet name is required.";
  if (age.trim() && !VALID_AGE.test(age.trim())) {
    errors.age = "Enter a valid age (e.g. 2 years, 6 months).";
  }
  if (!description.trim()) {
    errors.description = emptyDescriptionMessage;
  } else if (description.trim().length < 20) {
    errors.description = "Description must be at least 20 characters.";
  }
  if (category === "Other") {
    if (!customCategory.trim()) errors.customCategory = "Please specify the animal type.";
  } else if (!breed) {
    errors.breed = "Please select a breed.";
  } else if (breed === "Other" && !otherBreed.trim()) {
    errors.otherBreed = "Please specify the breed.";
  }
  if (!location.trim() || !hasSelectedRegion) {
    errors.location = "Select a valid location suggestion or choose a location on the map.";
  }
  if (requireImage && imageCount === 0) {
    errors.images = "Please add at least one photo.";
  }

  return errors;
}

export function getAdoptionRequestError(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) return fallback;

  // Prefer backend validation details before the generic transport error message.
  const candidate = error as {
    message?: unknown;
    response?: { data?: { error?: unknown; message?: unknown } };
  };
  const apiError = candidate.response?.data?.error;
  const apiMessage = candidate.response?.data?.message;

  if (typeof apiError === "string") return apiError;
  if (typeof apiMessage === "string") return apiMessage;
  return typeof candidate.message === "string" ? candidate.message : fallback;
}

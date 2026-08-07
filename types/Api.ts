// types/api.ts
// Shared TypeScript interfaces for all backend API responses.
// Import these in any screen that calls the rescue or forum API.

// ─── Shared types ──────────────────────────────────────────────────────────────

/** GPS coordinates returned by the backend */
export interface RescuerLocation {
  lat?: number;
  lng?: number;
  latitude: number;
  longitude: number;
  address?: string;
}

/** A rescuer document from the database */
export interface Rescuer {
  _id: string;
  userId?: string;
  name: string;
  phone?: string;
  avatar?: string;
  isAvailable?: boolean;
  location?: RescuerLocation;
}

// ─── Rescue API responses ──────────────────────────────────────────────────────

/** POST /api/rescue/find-nearest → returns nearest rescuer and distance */
export interface FindNearestResponse {
  rescuer: Rescuer;
  distance: string | number;
}

/** POST /api/rescue/send-request → creates a new rescue request */
export interface SendRequestResponse {
  requestId: string;
  status: RescueStatus;
  rescuer: Rescuer;
}

/** GET /api/rescue/status/:requestId → polls for request outcome */
export interface RescueStatusResponse {
  requestId: string;
  status: RescueStatus;
  rescuer: Rescuer | null;
}

export type RescueHistoryTab = "pending" | "completed" | "all";

export type RescueMarker = {
  latitude: number;
  longitude: number;
};

export type RescuePerson = {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  location?: RescueLocation | null;
};

export type RescueLocation = RescueMarker & {
  address?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
};

export type RescueCaseStatus = "pending" | "accepted" | "rejected" | "completed";

export type RescueCaseRecord = {
  rescueRequestId: string;
  caseId: string;
  status: RescueCaseStatus;
  animalType: string;
  description: string;
  photos: string[];
  /** Primary photo URL — use this first, fallback to photos[0] */
  photoUrl?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string | null;
  reporter: RescuePerson;
  rescuer: RescuePerson | null;
  location: RescueLocation;
  distanceKm: number;
  etaMinutes: number;
  summary: string;
};

export interface RescueHistoryResponse {
  pending: RescueCaseRecord[];
  completed: RescueCaseRecord[];
  all: RescueCaseRecord[];
  counts: {
    pending: number;
    completed: number;
    all: number;
  };
}

export interface LiveTrackingResponse {
  rescueRequestId: string;
  status: RescueCaseStatus;
  reporterLocation: RescueLocation;
  rescuerLocation: RescueLocation | null;
  distanceKm: number;
  etaMinutes: number;
  lastUpdatedAt: string;
  case: RescueCaseRecord;
}

/** GET /api/rescue/rescuers → all rescuers (used in Postman / debug) */
export interface ListRescuersResponse {
  count: number;
  rescuers: Rescuer[];
}

/** The three possible states of a rescue request */
export type RescueStatus = "pending" | "accepted" | "rejected" | "completed";

export interface RescueByIdResponse extends RescueCaseRecord {
  reporterLocation: RescueLocation;
  rescuerLocation: RescueLocation | null;
  lastUpdatedAt: string;
}

/** A comment (or reply) on a rescue case */
export interface RescueComment {
  _id: string;
  rescueRequestId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  parentCommentId: string | null;
  replies: RescueComment[];
  createdAt: string;
}


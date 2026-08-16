import React from "react";
import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { render, waitFor } from "@testing-library/react-native";
import CreateAdoptionPost from "../../app/adoption-corner/CreateAdoptionPost";

const mockGetReportByCaseId = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({ caseId: "SC-123" }),
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: "Images" },
}));

jest.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { name: "Rescuer", phone: "0771234567" } }),
}));

jest.mock("../../api/strayApiService", () => ({
  getReportByCaseId: (...args: unknown[]) => mockGetReportByCaseId(...args),
}));

jest.mock("../../services/adoptionService", () => ({ createPost: jest.fn() }));

jest.mock("../../components/chat/ChatLocationPicker", () => () => null);
jest.mock("../../components/MapViewWrapper", () => ({
  __esModule: true,
  default: () => null,
  Marker: () => null,
}));

describe("CreateAdoptionPost case prefill", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetReportByCaseId.mockResolvedValue({
      caseId: "SC-123",
      animalType: "Dog",
      breed: "Labrador Retriever",
      notes: "Friendly dog rescued from the roadside and ready for a loving home.",
      location: { lat: 6.9271, lng: 79.8612, address: "Colombo 07" },
      photos: ["https://example.com/report-photo.jpg"],
    });
  });

  it("loads report data into the updated adoption form when a case ID is supplied", async () => {
    const screen = render(<CreateAdoptionPost />);

    await waitFor(() => {
      expect(mockGetReportByCaseId).toHaveBeenCalledWith("SC-123");
      expect(screen.getByText(/Case SC-123 details have been added/i)).toBeTruthy();
      expect(screen.getByText("Labrador Retriever")).toBeTruthy();
      expect(screen.getByDisplayValue("Colombo 07")).toBeTruthy();
      expect(
        screen.getByDisplayValue("Friendly dog rescued from the roadside and ready for a loving home.")
      ).toBeTruthy();
      expect(screen.getByText("1/6")).toBeTruthy();
    });
  });
});

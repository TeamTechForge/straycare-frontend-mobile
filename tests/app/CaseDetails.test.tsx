import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Alert } from "react-native";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import CaseDetailsScreen from "../../app/reporting/CaseDetails";

const mockPush = jest.fn<(...args: any[]) => void>();
const mockReplace = jest.fn<(...args: any[]) => void>();
const mockGetReportByCaseId = jest.fn<(...args: any[]) => Promise<any>>();
const mockUpdateCaseStatus = jest.fn<(...args: any[]) => Promise<any>>();
const mockAxiosPost = jest.fn<(...args: any[]) => Promise<any>>();
let mockRole = "volunteer";
let mockParams: Record<string, string> = { caseId: "SC-123" };

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void) => {
    const React = require("react");
    React.useEffect(callback, [callback]);
  },
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn<() => Promise<string>>().mockResolvedValue("test-token"),
}));

jest.mock("axios", () => ({
  post: (...args: unknown[]) => mockAxiosPost(...args),
}));

jest.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { _id: "user-1", role: mockRole } }),
}));

jest.mock("../../api/strayApiService", () => ({
  getReportByCaseId: (...args: unknown[]) => mockGetReportByCaseId(...args),
  updateCaseStatus: (...args: unknown[]) => mockUpdateCaseStatus(...args),
}));

jest.mock("../../components/MapViewWrapper", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children),
    Marker: () => null,
  };
});

const availableCase = {
  caseId: "SC-123",
  animalType: "Dog",
  category: "Injured",
  status: "Needs Help",
  location: { lat: 6.9271, lng: 79.8612, address: "Colombo" },
  permissions: { canAccept: true, canUpdate: false },
};

describe("CaseDetails acceptance action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRole = "volunteer";
    mockParams = { caseId: "SC-123" };
    mockGetReportByCaseId.mockResolvedValue(availableCase);
    mockUpdateCaseStatus.mockResolvedValue({ ...availableCase, status: "Ready for Adoption" });
    mockAxiosPost.mockResolvedValue({ data: { requestId: "request-1" } });
  });

  it("shows the action to a rescuer when the case is unaccepted", async () => {
    const screen = render(<CaseDetailsScreen />);

    expect(await screen.findByText("Accept This Case")).toBeTruthy();
  });

  it("hides the action from a non-rescuer even if acceptance permission is present", async () => {
    mockRole = "reporter";
    const screen = render(<CaseDetailsScreen />);

    await screen.findByText("Case ID: SC-123");
    expect(screen.queryByText("Accept This Case")).toBeNull();
  });

  it("hides the action after a case has been accepted", async () => {
    mockGetReportByCaseId.mockResolvedValue({
      ...availableCase,
      status: "Under Rescue",
      permissions: { canAccept: false, canUpdate: false },
    });
    const screen = render(<CaseDetailsScreen />);

    await screen.findByText("Case ID: SC-123");
    expect(screen.queryByText("Accept This Case")).toBeNull();
  });

  it("shows the next valid status action for the assigned rescuer", async () => {
    mockGetReportByCaseId.mockResolvedValue({
      ...availableCase,
      status: "Under Rescue",
      permissions: { canAccept: false, canUpdate: true },
    });
    const screen = render(<CaseDetailsScreen />);

    expect(await screen.findByText('Mark as "Treated"')).toBeTruthy();
  });

  it("opens the adoption form with the case ID after marking a treated case ready for adoption", async () => {
    mockGetReportByCaseId.mockResolvedValue({
      ...availableCase,
      status: "Treated",
      permissions: { canAccept: false, canUpdate: true },
    });
    const screen = render(<CaseDetailsScreen />);

    fireEvent.press(await screen.findByText('Mark as "Ready for Adoption"'));

    await waitFor(() => {
      expect(mockUpdateCaseStatus).toHaveBeenCalledWith("SC-123", "Ready for Adoption");
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/adoption-corner/CreateAdoptionPost",
        params: { caseId: "SC-123" },
      });
    });
  });

  it("returns to the rescuer profile when opened from an active rescue card", async () => {
    mockParams = { caseId: "SC-123", source: "profile", focus: "status-update" };
    const screen = render(<CaseDetailsScreen />);

    fireEvent.press(await screen.findByText("Back to Profile"));

    expect(mockReplace).toHaveBeenCalledWith("/profile");
  });

  it("accepts the case and opens the first rescue-response screen", async () => {
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      const accept = buttons?.find((button) => button.text === "Accept");
      void accept?.onPress?.();
    });
    const screen = render(<CaseDetailsScreen />);

    fireEvent.press(await screen.findByText("Accept This Case"));

    await waitFor(() => {
      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.stringContaining("/strays/report/SC-123/accept"),
        {},
        { headers: { Authorization: "Bearer test-token" } }
      );
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/rescuer-response/[requestId]",
        params: { requestId: "request-1", caseId: "SC-123" },
      });
    });
  });
});

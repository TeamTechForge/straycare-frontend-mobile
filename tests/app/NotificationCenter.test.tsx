import React from "react";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import NotificationCenter from "../../app/notifications/NotificationCenter";

const mockPush = jest.fn<(...args: any[]) => void>();
const mockMarkAsRead = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);
const mockFetchNotifications = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);

jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("../../contexts/NotificationContext", () => ({
  useNotification: () => ({
    notifications: [
      {
        _id: "notification-1",
        userId: "user-1",
        title: "Case SC-100 Accepted",
        message: "A rescuer accepted your case.",
        type: "success",
        read: false,
        caseId: "SC-100",
        event: "rescue_accepted",
        createdAt: "2026-08-15T00:00:00.000Z",
      },
      {
        _id: "notification-2",
        userId: "user-1",
        title: "New Rescue Request",
        message: "A new rescue request for a dog is near you.",
        type: "info",
        read: false,
        rescueRequestId: "req-123",
        createdAt: "2026-08-15T00:00:00.000Z",
      },
    ],
    unreadCount: 2,
    fetchNotifications: mockFetchNotifications,
    markAsRead: mockMarkAsRead,
    loading: false,
  }),
}));

describe("NotificationCenter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps fetched notifications unread until opened and routes case updates to Case Details", async () => {
    const screen = render(<NotificationCenter />);

    expect(mockFetchNotifications).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByLabelText("View case SC-100"));

    expect(mockMarkAsRead).toHaveBeenCalledWith("notification-1");
    await Promise.resolve();
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/reporting/CaseDetails",
      params: { caseId: "SC-100" },
    });
  });

  it("does nothing when clicking a rescue request notification", async () => {
    const screen = render(<NotificationCenter />);
    fireEvent.press(screen.getByText("New Rescue Request"));
    expect(mockMarkAsRead).toHaveBeenCalledWith("notification-2");
    expect(mockPush).not.toHaveBeenCalled();
  });
});

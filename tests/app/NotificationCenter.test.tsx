import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import NotificationCenter from "../../app/notifications/NotificationCenter";

const mockPush = jest.fn();
const mockMarkAsRead = jest.fn().mockResolvedValue(undefined);
const mockFetchNotifications = jest.fn().mockResolvedValue(undefined);

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
    ],
    unreadCount: 1,
    fetchNotifications: mockFetchNotifications,
    markAsRead: mockMarkAsRead,
    loading: false,
  }),
}));

describe("NotificationCenter", () => {
  beforeEach(() => jest.clearAllMocks());

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
});

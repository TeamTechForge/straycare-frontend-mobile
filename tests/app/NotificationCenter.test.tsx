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
      {
        _id: "notification-2",
        userId: "user-1",
        title: "New post comment",
        message: "Alex commented on your post: Helpful update",
        type: "post_comment",
        read: false,
        postId: "post-123",
        event: "post_comment",
        createdAt: "2026-08-16T00:00:00.000Z",
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

  it("routes Community comment notifications to the post comments page", async () => {
    const screen = render(<NotificationCenter />);
    fireEvent.press(screen.getByText("New post comment"));

    expect(mockMarkAsRead).toHaveBeenCalledWith("notification-2");
    await Promise.resolve();
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/community-feed/CommunityPostComments",
      params: { id: "post-123" },
    });
  });
});

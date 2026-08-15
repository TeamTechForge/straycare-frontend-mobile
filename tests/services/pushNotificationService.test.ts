import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

const loadService = () => {
  return require("../../services/pushNotificationService").pushNotificationService;
};

describe("pushNotificationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock) = jest.fn();
  });

  it("registers the View Case action and returns null when notification permission is denied", async () => {
    const service = loadService();
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });

    await expect(service.setupPushNotifications()).resolves.toBeNull();

    expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith("case_update", [
      expect.objectContaining({ identifier: "view_case", buttonTitle: "View Case" }),
    ]);
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it("posts the Expo token with the authenticated session and saves it only after success", async () => {
    const service = loadService();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("session-token");
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

    await expect(service.sendTokenToBackend("ExponentPushToken[test]")).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/push-token"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer session-token" }),
        body: JSON.stringify({ pushToken: "ExponentPushToken[test]" }),
      })
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("pushToken", "ExponentPushToken[test]");
  });

  it("registers a push token once per authenticated session", async () => {
    const service = loadService();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("session-token");
    jest.spyOn(service, "setupPushNotifications").mockResolvedValue("ExponentPushToken[test]");
    jest.spyOn(service, "sendTokenToBackend").mockResolvedValue(true);

    await Promise.all([
      service.ensureAuthenticatedTokenRegistered(),
      service.ensureAuthenticatedTokenRegistered(),
    ]);
    await service.ensureAuthenticatedTokenRegistered();

    expect(service.setupPushNotifications).toHaveBeenCalledTimes(1);
    expect(service.sendTokenToBackend).toHaveBeenCalledWith("ExponentPushToken[test]");
  });

  it("replaces the foreground listener and cleans up the active subscription", () => {
    const service = loadService();
    const first = { remove: jest.fn() };
    const second = { remove: jest.fn() };
    (Notifications.addNotificationReceivedListener as jest.Mock)
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second);

    service.listenForNotifications(jest.fn());
    const cleanup = service.listenForNotifications(jest.fn());
    cleanup();

    expect(first.remove).toHaveBeenCalledTimes(1);
    expect(second.remove).toHaveBeenCalledTimes(1);
  });
});

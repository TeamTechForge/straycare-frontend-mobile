/* eslint-disable @typescript-eslint/no-require-imports */
import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import ReportingMapScreen from "../../app/reporting";

const mockGetAllReports = jest.fn<() => Promise<any[]>>();

jest.mock("../../api/strayApiService", () => ({
  getAllReports: () => mockGetAllReports(),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback: () => void) => {
    const React = require("react");
    React.useEffect(callback, [callback]);
  },
}));

jest.mock("../../components/MapViewWrapper", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Map = React.forwardRef(
    ({ children }: { children?: React.ReactNode }, ref: React.ForwardedRef<unknown>) => {
      React.useImperativeHandle(ref, () => ({ fitToCoordinates: jest.fn() }));
      return React.createElement(View, { testID: "rescue-map" }, children);
    }
  );
  Map.displayName = "MockMapViewWrapper";
  return {
    __esModule: true,
    default: Map,
    Marker: ({ pinColor }: { pinColor?: string }) =>
      React.createElement(View, { testID: `case-marker-${pinColor}` }),
  };
});

jest.mock("../../components/PrimaryButton", () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => {
    const React = require("react");
    const { Text } = require("react-native");
    return React.createElement(Text, null, title);
  },
}));

const reports = [
  { caseId: "SC-RED", animalType: "Dog", category: "Injured", status: "Needs Help", location: { lat: 1, lng: 1 } },
  { caseId: "SC-ORANGE", animalType: "Cat", category: "Injured", status: "Under Rescue", location: { lat: 2, lng: 2 } },
  { caseId: "SC-GREEN", animalType: "Dog", category: "Injured", status: "Treated", location: { lat: 3, lng: 3 } },
  { caseId: "SC-BLUE", animalType: "Cat", category: "Injured", status: "Ready for Adoption", location: { lat: 4, lng: 4 } },
];

describe("ReportingMap status filters", () => {
  it("defaults to Needs Help and adds the other public statuses through filter chips", async () => {
    mockGetAllReports.mockResolvedValue(reports);
    const screen = render(<ReportingMapScreen />);

    expect(await screen.findByTestId("case-marker-red")).toBeTruthy();
    expect(screen.queryByTestId("case-marker-orange")).toBeNull();
    expect(screen.queryByTestId("case-marker-#63ac84")).toBeNull();
    expect(screen.queryByTestId("case-marker-#2476da")).toBeNull();

    fireEvent.press(screen.getByText("Under Rescue"));
    expect(screen.getByTestId("case-marker-orange")).toBeTruthy();

    fireEvent.press(screen.getByText("Treated"));
    expect(screen.getByTestId("case-marker-#63ac84")).toBeTruthy();

    fireEvent.press(screen.getByText("Ready for Adoption"));
    expect(screen.getByTestId("case-marker-#2476da")).toBeTruthy();
  });
});

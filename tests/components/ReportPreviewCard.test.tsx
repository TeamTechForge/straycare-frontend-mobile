import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import ReportPreviewCard from "../../components/profile/ReportPreviewCard";

describe("ReportPreviewCard rescue actions", () => {
  it("exposes the rescue-failure action without replacing Update Status", () => {
    const onUpdateStatus = jest.fn();
    const onRescueFailed = jest.fn();
    const screen = render(
      <ReportPreviewCard
        title="Dog rescue"
        date="Today"
        status="Under Rescue"
        image=""
        actionText="Update Status"
        onActionPress={onUpdateStatus}
        secondaryActionText="Rescue Failed"
        onSecondaryActionPress={onRescueFailed}
      />
    );

    fireEvent.press(screen.getByText("Update Status"));
    fireEvent.press(screen.getByText("Rescue Failed"));

    expect(onUpdateStatus).toHaveBeenCalledTimes(1);
    expect(onRescueFailed).toHaveBeenCalledTimes(1);
  });
});

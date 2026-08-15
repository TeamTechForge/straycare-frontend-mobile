import { describe, expect, it } from "@jest/globals";
import { getCaseStatusUpdateRoute } from "../../utils/profileRoutes";

describe("rescuer profile routes", () => {
  it("opens the Case Details status-update section", () => {
    expect(getCaseStatusUpdateRoute("SC-123")).toEqual({
      pathname: "/reporting/CaseDetails",
      params: { caseId: "SC-123", source: "profile", focus: "status-update" },
    });
  });
});

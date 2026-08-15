export const getCaseStatusUpdateRoute = (caseId: string) => ({
  pathname: "/reporting/CaseDetails" as const,
  params: { caseId, source: "profile", focus: "status-update" },
});

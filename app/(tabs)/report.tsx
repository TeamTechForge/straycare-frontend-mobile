import { Redirect } from "expo-router";

/**
 * Report Tab
 * Redirects the user to the main stray animal reporting flow.
 */
export default function ReportTab() {
  return <Redirect href="/reporting" />;
}

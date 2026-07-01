import { API_URL } from "../constants/Config";

// Base URL for backend API
const BASE_URL = `${API_URL}/strays`;


// Backend returns { message } on failure (e.g. 401 "No token provided",
// 404 "Report not found") with a 2xx-shaped body but non-2xx status, so every
// call must check response.ok itself -- fetch() does not throw on 4xx/5xx.
const parseOrThrow = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }
  return data;
};

// 1.Sends a POST request to create a new stray report.then returns the created report from the backend.
export const submitReport = async (reportData) => {
  try {     //error handling to catch any issues during the fetch request
    const response = await fetch(`${BASE_URL}/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportData),
    });

    return await parseOrThrow(response);
  } catch (error) {
    console.error("Error submitting report:", error);
    throw error;
  }
};


// 2.Fetches all reports from the backend and returns them as JSON. Used to populate the map with markers.
export const getAllReports = async () => {
  try {
    const response = await fetch(`${BASE_URL}/reports`);
    const data = await parseOrThrow(response);
    const reports = Array.isArray(data) ? data : data?.value ?? [];
    return reports;
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};


// 3.Fetches a single report using its caseId. Used by the Case Details screen. Returns full report including photos, notes, timeline, location.
export const getReportByCaseId = async (caseId) => {
  try {
    const response = await fetch(`${BASE_URL}/report/${caseId}`);
    return await parseOrThrow(response);
  } catch (error) {
    console.error("Error fetching report:", error);
    throw error;
  }
};


// 4.Updates the status of a case by sending a PATCH request to the backend. The backend will automatically append a new entry to the case timeline with the status change. Returns the updated report with the new status and timeline.
export const updateCaseStatus = async (caseId, status) => {
  try {
    const response = await fetch(`${BASE_URL}/report/${caseId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    return await parseOrThrow(response);
  } catch (error) {
    console.error("Error updating case status:", error);
    throw error;
  }
};

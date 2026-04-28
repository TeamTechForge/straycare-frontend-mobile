// Base URL for backend API
const BASE_URL = "http://192.168.8.161:5000/api/strays";


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

    return await response.json();
  } catch (error) {
    console.error("Error submitting report:", error);
    throw error; 
  }
};


// 2.Fetches all reports from the backend and returns them as JSON. Used to populate the map with markers.
export const getAllReports = async () => {
  try {     
    const response = await fetch(`${BASE_URL}/reports`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};


// 3.Fetches a single report using its caseId. Used by the Case Details screen. Returns full report including photos, notes, timeline, location.
export const getReportByCaseId = async (caseId) => {
  try {
    const response = await fetch(`${BASE_URL}/report/${caseId}`);
    return await response.json();
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

    return await response.json();
  } catch (error) {
    console.error("Error updating case status:", error);
    throw error;
  }
};

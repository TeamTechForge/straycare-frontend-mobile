const BASE_URL = "http://192.168.8.161:5000/api/strays";

// 1️⃣ Submit a new report
export const submitReport = async (reportData) => {
  try {
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

// 2️⃣ Get all reports
export const getAllReports = async () => {
  try {
    const response = await fetch(`${BASE_URL}/reports`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};

// 3️⃣ Get a report by caseId
export const getReportByCaseId = async (caseId) => {
  try {
    const response = await fetch(`${BASE_URL}/report/${caseId}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching report:", error);
    throw error;
  }
};

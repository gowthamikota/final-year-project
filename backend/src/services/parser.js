const axios = require("axios");

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

async function parser(filePath) {
  if (!filePath) {
    throw new Error("filePath is required");
  }

  try {
    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/parse-resume`,
      { filePath },
      { timeout: 30000 }
    );

    if (!response.data?.success) {
      throw new Error(response.data?.error || "Parsing failed");
    }

    return response.data;

  } catch (err) {
    console.error("Resume parsing error:", err.response?.data || err.message);

    throw new Error(
      "Resume parsing service unavailable. Ensure Python microservice is running."
    );
  }
}

module.exports = { parser };
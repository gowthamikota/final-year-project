const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Enhanced parser with fallback logic
async function parser(filePath) {
  // Prefer Python microservice; default to localhost if env is missing
  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

  try {
    const response = await axios.post(
      `${pythonServiceUrl}/parse-resume`,
      { filePath },
      { timeout: 15000 }
    );

    return response.data;
  } catch (err) {
    console.warn("Python Service Error, falling back to local parsing:", err.message);
  }

  // No fallback: throw error to prevent fake data
  throw new Error("Resume parsing service unavailable. Ensure Python microservice is running at " + pythonServiceUrl);
}

module.exports = { parser };

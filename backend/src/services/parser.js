const axios = require("axios");
const logger = require("../utils/logger");

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

    //console.log("📄 Python Parser Raw Response:", response.data);

    // ✅ Return ONLY the parsed object
    return response.data.data;

  } catch (err) {
    logger.error("Resume parsing error", {
      message: err.response?.data || err.message,
    });

    throw new Error(
      "Resume parsing service unavailable. Ensure Python microservice is running."
    );
  }
}

module.exports = { parser };
const axios = require("axios");
const logger = require("../utils/logger");

async function runPreprocessor(userId) {
  try {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

    logger.info("Preprocessor started", { userId });

    const response = await axios.post(
      `${pythonServiceUrl}/preprocess`,
      { userId },
      { timeout: 60000 }
    );

    if (response.data?.success) {
      logger.info("Preprocessor success", { userId });
      return response.data;
    } else {
      logger.warn("Preprocessor failed", { userId, error: response.data?.error });
      throw new Error(response.data?.error || "Preprocessing failed");
    }
  } catch (err) {
    logger.error("Preprocessor error", {
      userId,
      message: err.response?.data?.error || err.message,
    });
    throw new Error(`Preprocessing failed: ${err.response?.data?.error || err.message}`);
  }
}

module.exports = { runPreprocessor };
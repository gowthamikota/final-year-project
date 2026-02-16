const axios = require("axios");

async function runPreprocessor(userId) {
  try {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";
    
    console.log(`[preprocessor] Starting for user ${userId}`);
    
    const response = await axios.post(
      `${pythonServiceUrl}/preprocess`,
      { userId },
      { timeout: 60000 } // 60 second timeout for embedding
    );

    if (response.data?.success) {
      console.log(`[preprocessor] Success for user ${userId}`);
      return response.data;
    } else {
      console.warn(`[preprocessor] Failed for user ${userId}:`, response.data?.error);
      throw new Error(response.data?.error || "Preprocessing failed");
    }
  } catch (err) {
    console.error("Preprocessor Error:", err.response?.data?.error || err.message);
    throw new Error(`Preprocessing failed: ${err.response?.data?.error || err.message}`);
  }
}

module.exports = { runPreprocessor };

const axios = require("axios");

async function runPreprocessor(userId) {
  try {
    const response = await axios.post(
      `${process.env.PYTHON_SERVICE_URL}/preprocess`,
      { userId }
    );

    return response.data;
  } catch (err) {
    console.error("Preprocessor Error:", err.response?.data || err.message);
    throw new Error("Failed to run preprocessor");
  }
}

module.exports = { runPreprocessor };

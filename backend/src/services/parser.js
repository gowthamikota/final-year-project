const axios = require("axios");

async function parser(filePath) {
  try {
    const response = await axios.post(
      `${process.env.PYTHON_SERVICE_URL}/parse-resume`,
      { filePath }
    );

    return response.data;
  } catch (err) {
    console.error("Python Service Error:", err.response?.data || err.message);
    throw new Error("Failed to parse resume");
  }
}

module.exports = { parser };

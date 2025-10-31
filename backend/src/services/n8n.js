const axios = require("axios");

async function triggerWorkflow(userId, filePath) {
  try {
    const response = await axios.post(
      // "http://localhost:5678/webhook/resume-trigger",
      {
        userId,
        filePath,
      }
      );
    console.log("n8n workflow response:", response.data);
  } catch (error) {
    console.error("Error triggering n8n workflow:", error.message);
  }
}

module.exports = { triggerWorkflow };

const axios = require("axios");


// this n8n workflow parses the data from profiles and sends to profileScrappedData collection directly.

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

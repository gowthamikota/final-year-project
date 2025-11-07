const axios = require("axios");
const leetcodeModel = require("../models/leetcodeData");
const githubModel = require("../models/githubData");
const codechefModel = require("../models/codechefData");
const codeforcesModel = require("../models/codeforcedData");


// this n8n workflow parses the data from profiles and sends to profileScrappedData collection directly.

async function triggerWorkflow(userId, profile,  profilePath) {
  try {
    const response = await axios.post(
      "http://localhost:5678/webhook/" + `${profile}`,
      {
        profilePath,
      }
    );
    
  } catch (error) {
    console.error("Error triggering n8n workflow:", error.message);
  }
}

module.exports = { triggerWorkflow };

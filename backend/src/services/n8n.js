const axios = require("axios");
const leetcodeModel = require("../models/leetcodeData");
const githubModel = require("../models/githubData");
const codechefModel = require("../models/codechefData");
const codeforcesModel = require("../models/codeforcedData");


// this n8n workflow parses the data from profiles and sends to profileScrappedData collection directly.

const profileModels = {
  leetcode: leetcodeModel,
  github: githubModel,
  codechef: codechefModel,
  codeforces: codeforcesModel,
};

async function triggerWorkflow(userId, profile,  profilePath) {
  try {
    const response = await axios.post(
      "http://localhost:5678/webhook/" + `${profile}`,
      {
        profilePath,
      }
    );

    const profileData = response.data;
    const Model = profileModel[profile.toLowerCase()];
    if (!Model) throw new Error(`Unknown profile type: ${profile}`);

    const saveDoc = new Model({
      userId,
      ...profileData
    });
    await saveDoc.save();
    console.log(`${profile} data stored successfully`);
    return { success: true, message: `${profile} data stored successfully` };

  } catch (error) {
    console.error("Error Detected:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { triggerWorkflow };

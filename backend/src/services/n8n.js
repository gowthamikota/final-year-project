const axios = require("axios");
const leetcodeModel = require("../models/leetcodeData");
const githubModel = require("../models/githubData");
const codechefModel = require("../models/codechefData");
const codeforcesModel = require("../models/codeforcesData");

const profileModels = {
  leetcode: leetcodeModel,
  github: githubModel,
  codechef: codechefModel,
  codeforces: codeforcesModel,
};

async function triggerWorkflow(userId, profile, profileUrl) {
  try {
    const webhookUrl = `http://localhost:5678/webhook/${profile}`;
    console.log(`Triggering n8n workflow: ${webhookUrl}`);
    console.log(`Sending profile path: ${profileUrl}`);

    const response = await axios.post(webhookUrl, { profileUrl });
    if (!response?.data) {
      throw new Error("Empty response from n8n workflow");
    }
    const profileData = response.data;
    const Model = profileModels[profile.toLowerCase()];
    if (!Model) throw new Error(`Unknown profile type: ${profile}`);
    const newDoc = new Model({
      userId,
      ...profileData,
    });

    await newDoc.save();
    console.log(`${profile} data saved successfully for user ${userId}`);
    return { success: true, message: `${profile} data stored successfully` };
  } catch (err) {
    console.error(`Error storing ${profile} data:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { triggerWorkflow };

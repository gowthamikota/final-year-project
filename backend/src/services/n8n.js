const axios = require("axios");
const leetcodeModel = require("../models/leetcodeData");
const githubModel = require("../models/githubData");
const codechefModel = require("../models/codechefData");
const codeforcesModel = require("../models/codeforcesData");

const profileModels = {
  github: githubModel,
  leetcode: leetcodeModel,
  "leetcode-scrapper": leetcodeModel, 
  codeforces: codeforcesModel,
  "codeforces-scrape": codeforcesModel, 
  codechef: codechefModel,
  "codechef-scrapper": codechefModel,
};


async function triggerWorkflow(userId, profile, profileUrl) {
  try {
    const webhookUrl = `http://localhost:5678/webhook/${profile}`;
    console.log(`Triggering n8n workflow: ${webhookUrl}`);
    console.log(`Sending profile URL: ${profileUrl}`);

  
    if (!profileUrl || typeof profileUrl !== "string") {
      throw new Error(`Invalid or missing profileUrl for profile: ${profile}`);
    }

    const response = await axios.post(webhookUrl, { profileUrl });

   
    console.log(
      `n8n response (${profile}):`,
      response.status,
      response.data
    );

    if (!response?.data || Object.keys(response.data).length === 0) {
      throw new Error("Empty response from n8n workflow");
    }

    let profileData = response.data;
    if (Array.isArray(profileData)) {
      profileData = Object.assign({}, ...profileData);
    }

    const Model = profileModels[profile.toLowerCase()];
    if (!Model) {
      throw new Error(`Unknown profile type: ${profile}`);
    }

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

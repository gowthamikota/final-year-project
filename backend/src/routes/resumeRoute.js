const express = require("express");
const resumeRouter = express.Router();

const { uploader } = require("../middlewares/uploaderMiddleware");
const { mergeData } = require("../services/mergeDocs");
const { runPreprocessor } = require("../services/runprocessor");

const githubModel = require("../models/githubData");
const leetcodeModel = require("../models/leetcodeData");
const codeforcesModel = require("../models/codeforcesData");
const codechefModel = require("../models/codechefData");

const { fetchGithub } = require("../services/platforms/githubService");
const { fetchLeetcode } = require("../services/platforms/leetcodeService");
const { fetchCodeforces } = require("../services/platforms/codeforcesService");
const { fetchCodechef } = require("../services/platforms/codechefService");

resumeRouter.post("/resume/upload", uploader, async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized user",
      });
    }

    let profileUrls = [];

    try {
      if (typeof req.body.profileUrls === "string") {
        profileUrls = JSON.parse(req.body.profileUrls);
      } else if (Array.isArray(req.body.profileUrls)) {
        profileUrls = req.body.profileUrls;
      }
    } catch (err) {
      console.warn("Invalid profileUrls JSON:", err.message);
    }

    for (const { profile, profileUrl } of profileUrls) {
      if (!profileUrl) continue;

      const username = profileUrl.split("/").filter(Boolean).pop();

      let data;

      switch (profile) {
        case "github":
          data = await fetchGithub(username);
          await githubModel.create({ userId, ...data });
          break;

        case "leetcode":
          data = await fetchLeetcode(username);
          await leetcodeModel.create({ userId, ...data });
          break;

        case "codeforces":
          data = await fetchCodeforces(username);
          await codeforcesModel.create({ userId, ...data });
          break;

        case "codechef":
          data = await fetchCodechef(username);
          await codechefModel.create({ userId, ...data });
          break;

        default:
          console.warn(`Unsupported profile type: ${profile}`);
      }
    }

    await mergeData(userId);
    await runPreprocessor(userId);

    return res.status(200).json({
      success: true,
      message: "Scraping and processing completed",
    });

  } catch (err) {
    console.error("Error in resume/upload:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = resumeRouter;
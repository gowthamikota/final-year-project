const express = require("express");
const resumeRouter = express.Router();

const { uploader } = require("../middlewares/uploaderMiddleware");
const { mergeData } = require("../services/mergeDocs");
const { runPreprocessor } = require("../services/runprocessor");
const resumeDataModel = require("../models/resumeParsedData");

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

    if (!userId) {
      console.error("User not authenticated in resume/upload");
      return res.status(401).json({ 
        success: false,
        error: "User not authenticated" 
      });
    }

    // Ensure resume was parsed by uploader middleware
    if (!req.parsedResume) {
      console.error("Resume not parsed by uploader middleware");
      return res.status(400).json({
        success: false,
        error: "Resume file was not properly processed"
      });
    }

    // Check if this is a simple resume upload (file only) or profile scraping (with URLs)
    const hasFile = req.file;
    const hasProfileUrls = req.body.profileUrls;

    // Handle simple resume file upload
    if (hasFile && !hasProfileUrls) {
      // Resume already parsed and saved by uploader middleware
      return res.status(200).json({
        success: true,
        message: "Resume uploaded and parsed successfully",
        data: req.parsedResume
      });
    }

    // Handle profile scraping with URLs
    let profileUrls = [];

    try {
      if (typeof req.body.profileUrls === "string") {
        profileUrls = JSON.parse(req.body.profileUrls);
        console.log("Parsed profileUrls from string:", profileUrls);
      } else if (Array.isArray(req.body.profileUrls)) {
        profileUrls = req.body.profileUrls;
        console.log("ProfileUrls already an array:", profileUrls);
      }
    } catch (err) {
      console.warn("Invalid profileUrls JSON:", err.message, "Raw value:", req.body.profileUrls);
    }

    console.log(`Processing ${profileUrls.length} profiles for user ${userId}`);
    
    // Track successful operations
    let profilesQueued = 0;
    let profilesFailed = 0;

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

    // Try to merge data (optional - may not have data yet)
    try {
      await mergeData(userId);
      console.log("Data merged successfully");
    } catch (mergeErr) {
      console.warn("Failed to merge data (may not have scraped data yet):", mergeErr.message);
    }

    // Start preprocessing in background (don't wait for it)
    // Preprocessing requires merged data, so it will wait until profiles are scraped
    if (profilesQueued > 0) {
      // Only preprocess if profiles were queued (asynchronously)
      runPreprocessor(userId)
        .then(() => console.log("Preprocessor completed in background"))
        .catch(err => console.warn("Background preprocessor warning:", err.message));
    }

    // Return success immediately (don't wait for preprocessing)
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

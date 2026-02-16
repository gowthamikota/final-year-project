const express = require("express");
const resumeRouter = express.Router();
const { triggerWorkflow } = require("../services/n8n");
const { uploader } = require("../middlewares/uploaderMiddleware");
const { mergeData } = require("../services/mergeDoc");
const { runPreprocessor } = require("../services/runprocessor");
const resumeDataModel = require("../models/resumeParsedData");


resumeRouter.post("/resume/upload", uploader, async (req, res) => {
  try {
    const userId = req.user?._id;

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
      if (!profileUrl) {
        console.warn(`Skipping ${profile} - missing profileUrl`);
        continue;
      }
      try {
        console.log(`Queuing workflow for ${profile}: ${profileUrl}`);
        await triggerWorkflow(userId, profile, profileUrl);
        profilesQueued++;
        console.log(`Successfully queued ${profile} workflow`);
      } catch (workflowErr) {
        profilesFailed++;
        console.warn(`Failed to queue ${profile} workflow:`, workflowErr.message);
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
      message: `Resume uploaded successfully. ${profilesQueued} profile(s) queued for processing. Analysis will be available shortly.`,
      data: {
        resumeParsed: true,
        profilesQueued,
        profilesFailed
      }
    });
  } catch (err) {
    console.error("Error in resume/upload:", err.message);
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Get parsed resume data for a user
resumeRouter.get("/resume/parsed/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const resumeData = await resumeDataModel.findOne({ userId });
    
    if (!resumeData) {
      return res.status(404).json({
        success: false,
        error: "No resume data found"
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        skills: resumeData.skills || [],
        name: resumeData.name || "",
        email: resumeData.email || "",
        phone: resumeData.phone || "",
        education: resumeData.education || [],
        experience: resumeData.experience || [],
        projects: resumeData.projects || [],
        certifications: resumeData.certifications || [],
        achievements: resumeData.achievements || [],
      }
    });
  } catch (err) {
    console.error("Error fetching resume data:", err.message);
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

module.exports = resumeRouter;




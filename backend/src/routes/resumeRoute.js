const express = require("express");
const resumeRouter = express.Router();

const { uploader } = require("../middlewares/uploaderMiddleware");
const { mergeData } = require("../services/mergeDocs");
const { runPreprocessor } = require("../services/runprocessor");
const resumeParsedDataModel = require("../models/resumeParsedData");

const githubModel = require("../models/githubData");
const leetcodeModel = require("../models/leetcodeData");
const codeforcesModel = require("../models/codeforcesData");
const codechefModel = require("../models/codechefData");

const { fetchGithub } = require("../services/platforms/githubService");
const { fetchLeetcode } = require("../services/platforms/leetcodeService");
const { fetchCodeforces } = require("../services/platforms/codeforcesService");
const { fetchCodechef } = require("../services/platforms/codechefService");

// Helper: Compare two objects (exclude timestamps and _id)
const hasDataChanged = (existing, newData) => {
  if (!existing) return true; // No existing data, so it's new
  
  // Compare all fields except MongoDB metadata
  const oldData = { ...existing.toObject() };
  delete oldData._id;
  delete oldData.__v;
  delete oldData.createdAt;
  delete oldData.updatedAt;
  delete oldData.userId;
  
  const freshData = { ...newData };
  delete freshData.userId;
  
  return JSON.stringify(oldData) !== JSON.stringify(freshData);
};

// ---------------- GET PARSED RESUME ----------------
resumeRouter.get("/resume/parsed/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const parsedResume = await resumeParsedDataModel
      .findOne({ userId })
      .sort({ createdAt: -1 });

    if (!parsedResume) {
      return res.status(404).json({
        success: false,
        error: "No parsed resume data found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        skills: parsedResume.skills || [],
        education: Array.isArray(parsedResume.education)
          ? parsedResume.education
          : parsedResume.education
            ? [parsedResume.education]
            : [],
        experience: parsedResume.experience || [],
        projects: parsedResume.projects || [],
        certifications: parsedResume.certifications || [],
        achievements: parsedResume.achievements || [],
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

const extractUsername = (profile, profileUrl) => {
  try {
    const url = new URL(profileUrl);

    if (profile === "codeforces") {
      const handles = url.searchParams.get("handles");
      if (handles) return handles.split(";")[0];

      const parts = url.pathname.split("/").filter(Boolean);
      const profileIndex = parts.indexOf("profile");
      if (profileIndex >= 0 && parts[profileIndex + 1]) {
        return parts[profileIndex + 1];
      }
    }

    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch (err) {
    return profileUrl.split("/").filter(Boolean).pop() || "";
  }
};

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

    // Check if this is a simple resume upload (file only) or profile scraping (with URLs)
    const hasFile = req.file;
    const hasProfileUrls = req.body.profileUrls;
    const noNewFile = req.noNewFile;
    const resumeReuseReason = req.resumeReuseReason;

    // If no new file and trying to scrape profiles, fetch existing resume from DB
    let parsedResume = req.parsedResume;
    if (noNewFile && hasProfileUrls && !parsedResume) {
      try {
        parsedResume = await resumeParsedDataModel
          .findOne({ userId })
          .sort({ createdAt: -1 });
        
        if (!parsedResume) {
          return res.status(400).json({
            success: false,
            error: "No existing resume found. Please upload your resume first."
          });
        }
        console.log("✅ Reusing existing resume (no new file provided) - NO PARSING");
      } catch (err) {
        console.error("Error fetching existing resume:", err.message);
        return res.status(500).json({
          success: false,
          error: "Failed to retrieve existing resume"
        });
      }
    } else if (!parsedResume && hasFile) {
      // File was uploaded but not parsed
      console.error("Resume not parsed by uploader middleware");
      return res.status(400).json({
        success: false,
        error: "Resume file was not properly processed"
      });
    } else if (!parsedResume && !hasFile && !hasProfileUrls) {
      // No file, no existing resume
      return res.status(400).json({
        success: false,
        error: "Resume file is required"
      });
    }

    // Log the reason
    if (resumeReuseReason === "identical_hash") {
      console.log("ℹ️ Using identical resume from profile (same file hash)");
    } else if (parsedResume && hasFile) {
      console.log("✅ New resume uploaded and parsed");
    }

    // Handle simple resume file upload
    if (hasFile && !hasProfileUrls) {
      // Resume already parsed and saved by uploader middleware
      return res.status(200).json({
        success: true,
        message: "Resume uploaded and parsed successfully",
        data: parsedResume
      });
    }

    // Handle profile scraping with URLs
    let profileUrls = [];

    try {
      if (typeof req.body.profileUrls === "string") {
        const raw = req.body.profileUrls.trim().replace(/[.;]+$/, "");
        profileUrls = JSON.parse(raw);
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

      const username = extractUsername(profile, profileUrl);
      if (!username) {
        console.warn(`Unable to extract username for ${profile}:`, profileUrl);
        profilesFailed++;
        continue;
      }

      let data;

      switch (profile) {
        case "github":
          try {
            // Check existing data first
            const existingGithub = await githubModel.findOne({ userId });
            
            // Fetch fresh data
            data = await fetchGithub(username);
            
            // Only update if data actually changed
            if (hasDataChanged(existingGithub, data)) {
              await githubModel.findOneAndUpdate(
                { userId },
                { userId, ...data },
                { upsert: true, new: true, setDefaultsOnInsert: true }
              );
              profilesQueued++;
              console.log("✅ GitHub data updated (changes detected)");
            } else {
              profilesQueued++;
              console.log("♻️ GitHub data unchanged, skipped DB write");
            }
          } catch (ghErr) {
            profilesFailed++;
            console.warn("GitHub save failed:", ghErr.message);
          }
          break;

        case "leetcode":
          try {
            const existingLeetcode = await leetcodeModel.findOne({ userId });
            data = await fetchLeetcode(username);
            
            if (hasDataChanged(existingLeetcode, data)) {
              await leetcodeModel.findOneAndUpdate(
                { userId },
                { userId, ...data },
                { upsert: true, new: true, setDefaultsOnInsert: true }
              );
              profilesQueued++;
              console.log("✅ LeetCode data updated (changes detected)");
            } else {
              profilesQueued++;
              console.log("♻️ LeetCode data unchanged, skipped DB write");
            }
          } catch (lcErr) {
            profilesFailed++;
            console.warn("LeetCode save failed:", lcErr.message);
          }
          break;

        case "codeforces":
          try {
            const existingCodeforces = await codeforcesModel.findOne({ userId });
            data = await fetchCodeforces(username);
            
            if (hasDataChanged(existingCodeforces, data)) {
              await codeforcesModel.findOneAndUpdate(
                { userId },
                { userId, ...data },
                { upsert: true, new: true, setDefaultsOnInsert: true }
              );
              profilesQueued++;
              console.log("✅ Codeforces data updated (changes detected)");
            } else {
              profilesQueued++;
              console.log("♻️ Codeforces data unchanged, skipped DB write");
            }
          } catch (cfErr) {
            profilesFailed++;
            console.warn("Codeforces save failed:", cfErr.message);
          }
          break;

        case "codechef":
          try {
            const existingCodechef = await codechefModel.findOne({ userId });
            data = await fetchCodechef(username);
            
            if (hasDataChanged(existingCodechef, data)) {
              await codechefModel.findOneAndUpdate(
                { userId },
                { userId, ...data },
                { upsert: true, new: true, setDefaultsOnInsert: true }
              );
              profilesQueued++;
              console.log("✅ CodeChef data updated (changes detected)");
            } else {
              profilesQueued++;
              console.log("♻️ CodeChef data unchanged, skipped DB write");
            }
          } catch (ccErr) {
            profilesFailed++;
            console.warn("CodeChef save failed:", ccErr.message);
          }
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

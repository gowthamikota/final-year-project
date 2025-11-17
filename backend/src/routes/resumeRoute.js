const express = require("express");
const resumeRouter = express.Router();
const { triggerWorkflow } = require("../services/n8n");
const { uploader } = require("../middlewares/uploaderMiddleware");
const { mergeData } = require("../services/mergeDoc");
const { runPreprocessor } = require("../services/runprocessor");

// triggering of the resumeparser.py and n8n happens here and store data in their respective collections
resumeRouter.post("/resume/upload", uploader, async (req, res) => {
  try {
    const userId = req.user?._id || "674A9C000000000000000000";

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
      if (!profileUrl) {
        console.warn(`Skipping ${profile} - missing profileUrl`);
        continue;
      }
      await triggerWorkflow(userId, profile, profileUrl);
    }

    await mergeData(userId);
    const out = await runPreprocessor(userId);

    console.log("Processing completed", out);

    return res.status(200).json({
      success: true,
      message: "Resume uploaded, parsed, and workflows executed successfully",
      parsedResume: req.parsedResume,
    });
  } catch (err) {
    console.error("Error in resume/upload:", err.message);
    return res.status(500).json({ error: err.message });
  }
});



//gets processed data from the ProcessedData collection and sends this data to analyzeprofile.py file
resumeRouter.get("/resume/:userId", async (req, res) => {
    
});

// delete the uploaded resume of the user
resumeRouter.delete("/resume/:delete", async (req, res) => {
    
});

module.exports = resumeRouter;




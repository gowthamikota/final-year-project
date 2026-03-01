const express = require("express");
const analysisRouter = express.Router();
const axios = require("axios");
const Groq = require("groq-sdk");
const FinalResults = require("../models/finalResultData");
const AnalysisHistory = require("../models/analysisHistoryData");
const { ObjectId } = require('mongoose').Types;
const multer = require("multer");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

// ---------------- RUN ANALYSIS ----------------
analysisRouter.post("/analysis/run", async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const jobRole = (req.body?.jobRole || "").toString().trim();

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized user",
      });
    }

    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/analyze-profile`,
      { userId, jobRole },
      { timeout: 60000 }
    );

    const pythonData = response.data;

    if (!pythonData.success) {
      return res.status(400).json({
        success: false,
        error: pythonData.message,
      });
    }

    return res.json({
      success: true,
      message: "Profile analysis completed",
      data: pythonData,
    });

  } catch (err) {
    console.error("Analysis error:", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      error: "Analysis service failed",
    });
  }
});

// ---------------- GET ANALYSIS + LLM ----------------
analysisRouter.get("/analysis/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { jobRole } = req.query;

    // Convert string userId to ObjectId for database query
    const { ObjectId } = require('mongoose').Types;
    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: "Invalid userId format",
      });
    }

    const result = await FinalResults.findOne({ userId: objectId });
    const history = await AnalysisHistory.find({ userId: objectId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log("🔍 DEBUG - Analysis result for userId:", userId);
    console.log("  Scores:", result?.scores);
    console.log("  Final Score:", result?.finalScore);
    console.log("  History count:", history?.length);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "No analysis found",
      });
    }

    const prompt = `
Developer Scores:
${JSON.stringify(result.scores, null, 2)}

Final Score: ${result.finalScore}
Target Role: ${jobRole || "Not specified"}

Generate:
- Key strengths
- Weak skills
- 4 improvement steps
- Resume suggestions
Keep concise.
`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a concise technical career coach for software developers.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const suggestions = completion.choices?.[0]?.message?.content || "";

    return res.json({
      success: true,
      data: result,
      history,
      suggestions,
    });

  } catch (err) {
    console.error("LLM error:", err.message);

    return res.status(500).json({
      success: false,
      error: "Suggestion generation failed",
    });
  }
});

module.exports = analysisRouter;

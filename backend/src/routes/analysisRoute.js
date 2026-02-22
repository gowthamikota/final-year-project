const express = require("express");
const analysisRouter = express.Router();
const axios = require("axios");
const FinalResults = require("../models/finalResultData");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

// ---------------- RUN ANALYSIS ----------------
analysisRouter.post("/analysis/run", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/analyze-profile`,
      { userId },
      { timeout: 60000 }
    );

    return res.json({
      success: true,
      message: "Profile analysis completed",
      data: response.data,
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

    const result = await FinalResults.findOne({ userId });

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

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const response = await model.generateContent(prompt);
    const suggestions = response.response.text();

    return res.json({
      success: true,
      data: result,
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

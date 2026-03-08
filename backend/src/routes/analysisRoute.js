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

// ---------------- ANALYSIS HISTORY (FILTER + PAGINATION) ----------------
analysisRouter.get("/analysis/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user?._id?.toString();
    const {
      q = "",
      role = "",
      minScore,
      maxScore,
      page = "1",
      limit = "10",
    } = req.query;

    if (!requesterId || requesterId !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch (err) {
      return res.status(400).json({ success: false, error: "Invalid userId format" });
    }

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (safePage - 1) * safeLimit;

    const filter = { userId: objectId };
    const andConditions = [];

    if (q && q.trim()) {
      const term = q.trim();
      andConditions.push({
        $or: [
        { jobRole: { $regex: term, $options: "i" } },
        { role: { $regex: term, $options: "i" } },
        { jobDescription: { $regex: term, $options: "i" } },
        ],
      });
    }

    if (role && role.trim()) {
      const roleRegex = { $regex: `^${role.trim()}$`, $options: "i" };
      andConditions.push({
        $or: [{ jobRole: roleRegex }, { role: roleRegex }],
      });
    }

    const scoreFilter = {};
    const parsedMin = Number(minScore);
    const parsedMax = Number(maxScore);

    if (!Number.isNaN(parsedMin)) scoreFilter.$gte = parsedMin;
    if (!Number.isNaN(parsedMax)) scoreFilter.$lte = parsedMax;
    if (Object.keys(scoreFilter).length > 0) andConditions.push({ finalScore: scoreFilter });

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const [rows, total] = await Promise.all([
      AnalysisHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      AnalysisHistory.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
        hasNext: skip + rows.length < total,
        hasPrev: safePage > 1,
      },
    });
  } catch (err) {
    console.error("History fetch error:", err.message);
    return res.status(500).json({ success: false, error: "Failed to fetch analysis history" });
  }
});

// ---------------- RUN ANALYSIS ----------------
analysisRouter.post("/analysis/run", async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const jobRole = (req.body?.jobRole || "").toString().trim();
    const jobDescription = (req.body?.jobDescription || "").toString().trim();

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized user",
      });
    }

    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/analyze-profile`,
      { userId, jobRole, jobDescription },
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
    const requesterId = req.user?._id?.toString();

    if (!requesterId || requesterId !== userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
      });
    }

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
Confidence Score: ${result.confidenceScore}% (Based on ${Object.keys(result.scores).filter(k => result.scores[k] > 0).length} connected platforms)

Target Role: ${jobRole || "Not specified"}

The confidence score indicates how reliable this evaluation is based on available data:
- Higher confidence (>70%): Multiple platforms connected with strong data
- Medium confidence (40-70%): Some platforms connected with moderate data  
- Lower confidence (<40%): Limited data available, recommendation may be less accurate

Generate:
- Key strengths (based on highest scoring platforms)
- Weak skills (platforms with low scores or missing data)
- 4 actionable improvement steps (prioritize based on confidence score - if confidence is low, emphasize data collection)
- Resume suggestions
- Brief explanation of what the confidence score means for this candidate

Keep concise and actionable.
`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a concise technical career coach for software developers. You help interpret candidate evaluation data, including confidence scores that indicate data reliability. You do NOT calculate scores - you explain them.",
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

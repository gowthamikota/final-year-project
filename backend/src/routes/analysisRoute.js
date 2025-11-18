const express = require("express");
const analysisRouter = express.Router();
const FinalResults = require("../models/finalResultData");
const path = require("path");
const { execFile } = require("child_process");
const { GoogleGenerativeAI } = require("@google/generative-ai");


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


analysisRouter.post("/analysis/run", async (req, res) => {
  try {
    const userId = req.body?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is missing",
      });
    }

    const scriptPath = path.join(__dirname, "../python/analyzeProfile.py");
    const pythonPath = path.join(
      __dirname,
      "../python/venv/Scripts/python.exe"
    );

    execFile(pythonPath, [scriptPath, userId], (error, stdout, stderr) => {
      if (error) {
        console.error("Python Error:", error);
        return res.status(500).json({
          success: false,
          error: "Analysis failed",
        });
      }

      if (stderr) console.error("PY STDERR:", stderr);

      let pyOutput;
      try {
        pyOutput = JSON.parse(stdout);
      } catch (err) {
        console.error("Invalid JSON from Python:", err);
        return res.status(500).json({
          success: false,
          error: "Invalid Python output format",
        });
      }

      return res.json({
        success: true,
        message: "Profile analysis completed",
        data: pyOutput,
      });
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});


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

    const llmPrompt = `
Developer performance scores:

${JSON.stringify(result.scores, null, 2)}

Final Score: ${result.finalScore}

Target Job Role: ${jobRole || "Not specified"}

Generate the following:
- 3–4 key strengths
- Weak/missing skills
- 4 improvement steps for the target role
- Resume improvement suggestions

Keep it short, clear, and helpful.
    `;

    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const response = await model.generateContent(llmPrompt);
    const suggestions = response.response.text();

    return res.json({
      success: true,
      analysis: result,
      suggestions,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

module.exports = analysisRouter;

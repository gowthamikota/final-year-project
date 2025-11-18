const express = require("express");
const analysisRouter = express.Router();
const finalResults = require("../models/finalResultData"); 
const path = require("path");
const { execFile } = require("child_process");


analysisRouter.post("/analysis/run", async (req, res) => {
  try {
    const  userId  = req.body?.userId;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "userId is missing" });
    }

    const scriptPath = path.join(__dirname, "../python/analyzeProfile.py");
    const pythonPath = path.join(
      __dirname,
      "../python/venv/Scripts/python.exe"
    );

    execFile(pythonPath, [scriptPath, userId], (error, stdout, stderr) => {
      if (error) {
        console.error("Python Error:", error);
        return res
          .status(500)
          .json({ success: false, error: "Analysis failed" });
      }

      if (stderr) {
        console.error("PY STDERR:", stderr);
      }

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
    res.status(500).json({ success: false, error: "Server error" });
  }
});


analysisRouter.get("/analysis/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { jobRole } = req.query;

    const result = await finalResults.findOne({ userId });

    if (!result) {
      return res
        .status(404)
        .json({ success: false, error: "No analysis found" });
    }

   
    const llmPrompt = `
The following developer performance scores were generated:

${JSON.stringify(result.scores, null, 2)}

Final Score: ${result.finalScore}

They are aiming for job role: ${jobRole || "Not specified"}.

Generate:
- Key strengths
- Missing skills
- How to improve for the target job
- Resume improvements
Keep it short, clear, and useful.
    `;

    const suggestionsResponse = await global.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: llmPrompt }],
    });

    const suggestions = suggestionsResponse.choices[0].message.content;

    return res.json({
      success: true,
      analysis: result,
      suggestions,
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

module.exports = analysisRouter;

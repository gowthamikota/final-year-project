const express = require("express");
const analysisRouter = express.Router();
const finalResultModel = require("../models/finalResultData");
const path = require("path");
const { execFile } = require("child_process");


analysisRouter.post("/analysis/run", async (req, res) => {
    
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId is missing" });
        }

        const scriptPath = path.join(__dirname, "../python/analyzeprofile.py");

        execFile("python", [scriptPath, userId], (error, stdout, stderr) => {
          if (error) {
            console.error("Python Error:", stderr);
            return res.status(500).json({ error: "Analysis failed" });
          }
          console.log("PYTHON OUTPUT:", stdout);

          return res.json({
            success: true,
            message: "Profile analysis completed",
          });
        });    
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});


analysisRouter.get("/analysis/:userId", async (req, res) => {
  try {
        const { userId } = req.params;
        const { jobRole } = req.query; 

        const result = await FinalResult.findOne({ userId });

        if (!result) {
        return res.status(404).json({ error: "No analysis found" });
        }

    
    const llmPrompt = `
        You are an AI assistant. A developer has the following analysis results:

        ${JSON.stringify(result.analysis, null, 2)}

        The developer is aiming for this job role: ${jobRole || "Not specified"}.

        Generate:
        - clear suggestions
        - missing skills
        - resume improvements
        Keep it short and helpful.
        `;

    const suggestions = await global.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: llmPrompt }],
    });

    return res.json({
      analysis: result,
      suggestions: suggestions.choices[0].message.content,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = analysisRouter;




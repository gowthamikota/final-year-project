const express = require("express");
const analysisRouter = express.Router();
const FinalResults = require("../models/finalResultData");
const resumeDataModel = require("../models/resumeParsedData");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");

// Initialize Gemini AI only if API key is available
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});


analysisRouter.post("/analysis/run", async (req, res) => {
  try {
    const userId = req.body?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is missing",
      });
    }

    // Use Python microservice instead of execFile
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

    try {
      const response = await axios.post(
        `${pythonServiceUrl}/analyze-profile`,
        { userId },
        { timeout: 30000 }
      );

      if (response.data && response.data.success) {
        return res.json({
          success: true,
          message: "Profile analysis completed",
          data: response.data,
        });
      } else {
        throw new Error(response.data?.error || "Analysis failed");
      }
    } catch (pythonError) {
      console.error("Python service error:", pythonError.message);
      return res.status(500).json({
        success: false,
        error: `Analysis failed: ${pythonError.message}. Ensure Python service is running at ${pythonServiceUrl}`,
      });
    }
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
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

    let suggestions = "Analysis data available. AI suggestions require GEMINI_API_KEY configuration.";

    if (genAI && process.env.GEMINI_API_KEY) {
      try {
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

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const response = await model.generateContent(llmPrompt);
        suggestions = response.response.text();
      } catch (aiError) {
        console.warn("AI suggestions failed:", aiError.message);
        suggestions = `Based on your scores:\n- Strong areas: ${Object.entries(result.scores).filter(([k,v]) => v > 70).map(([k]) => k).join(", ")}\n- Areas to improve: ${Object.entries(result.scores).filter(([k,v]) => v < 50).map(([k]) => k).join(", ")}`;
      }
    }

    return res.json({
      success: true,
      data: result,
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

// New endpoint for job-resume compatibility analysis
analysisRouter.post("/analysis/job", upload.single('resume'), async (req, res) => {
  try {
    const { jobRole, jobDescription } = req.body;
    const userId = req.user?._id;

    if (!jobRole || !jobDescription) {
      return res.status(400).json({
        success: false,
        error: "Job role and description are required",
      });
    }

    // Get user's resume data
    let userSkills = [];
    if (userId) {
      const resumeData = await resumeDataModel.findOne({ userId });
      if (resumeData) {
        userSkills = resumeData.skills || [];
      }
    }

    let requiredSkills = [];
    let matchedSkills = [];
    let missingSkills = [];
    let recommendations = [];
    let score = 0;

    // Check if Gemini AI is available
    if (genAI && process.env.GEMINI_API_KEY) {
      try {
        // Use AI to analyze job description and extract required skills
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        const skillExtractionPrompt = `
Analyze this job description and extract required skills:

Job Role: ${jobRole}
Job Description: ${jobDescription}

Return a JSON object with:
{
  "requiredSkills": ["skill1", "skill2", ...],
  "niceToHaveSkills": ["skill1", "skill2", ...]
}

Only return the JSON, no additional text.
        `;

        const skillResponse = await model.generateContent(skillExtractionPrompt);
        const skillText = skillResponse.response.text();
        
        // Extract JSON from response
        const jsonMatch = skillText.match(/\{[\s\S]*\}/);
        const extractedSkills = jsonMatch ? JSON.parse(jsonMatch[0]) : { requiredSkills: [], niceToHaveSkills: [] };
        
        requiredSkills = extractedSkills.requiredSkills || [];
        const allJobSkills = [...requiredSkills, ...(extractedSkills.niceToHaveSkills || [])];
        
        // Calculate match
        matchedSkills = userSkills.filter(skill => 
          allJobSkills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase()) || 
            skill.toLowerCase().includes(jobSkill.toLowerCase())
          )
        );
        
        missingSkills = requiredSkills.filter(jobSkill => 
          !userSkills.some(skill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase()) || 
            skill.toLowerCase().includes(jobSkill.toLowerCase())
          )
        );
        
        score = requiredSkills.length > 0 
          ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
          : 0;

        // Generate recommendations
        const recPrompt = `
User has these skills: ${userSkills.join(", ")}
Job requires: ${requiredSkills.join(", ")}
Missing skills: ${missingSkills.join(", ")}
Match score: ${score}%

Generate 4 specific, actionable recommendations to improve their candidacy for this ${jobRole} role.
Return as a JSON array of strings.
        `;

        const recResponse = await model.generateContent(recPrompt);
        const recText = recResponse.response.text();
        const recJsonMatch = recText.match(/\[[\s\S]*\]/);
        recommendations = recJsonMatch ? JSON.parse(recJsonMatch[0]) : [];
      } catch (aiError) {
        console.warn("AI analysis failed, using fallback:", aiError.message);
        // Fall through to fallback logic
      }
    }
    
    // Fallback logic when AI is not available or fails
    if (!genAI || !process.env.GEMINI_API_KEY || recommendations.length === 0) {
      // Simple keyword-based analysis
      const commonSkills = ["JavaScript", "Python", "React", "Node.js", "Java", "TypeScript", "AWS", "Docker", "SQL", "Git"];
      const jobDescLower = jobDescription.toLowerCase();
      
      requiredSkills = commonSkills.filter(skill => 
        jobDescLower.includes(skill.toLowerCase())
      );
      
      matchedSkills = userSkills.filter(skill => 
        jobDescLower.includes(skill.toLowerCase())
      );
      
      missingSkills = requiredSkills.filter(skill => 
        !userSkills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      
      score = requiredSkills.length > 0 
        ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
        : 75; // Default decent score if no skills detected
      
      recommendations = [
        `Focus on learning ${missingSkills.slice(0, 3).join(", ") || "industry-relevant skills"} to better match this ${jobRole} position`,
        `Highlight your ${matchedSkills.slice(0, 2).join(" and ") || "relevant"} experience in your resume`,
        `Add specific projects demonstrating ${jobRole} responsibilities to your portfolio`,
        `Consider taking online courses or certifications in ${missingSkills[0] || "key technologies"} mentioned in the job description`
      ];
    }

    return res.json({
      success: true,
      data: {
        score,
        matchedSkills,
        missingSkills,
        recommendations,
        requiredSkills,
      }
    });
  } catch (err) {
    console.error("Job analysis error:", err);
    return res.status(500).json({
      success: false,
      error: "Analysis failed: " + err.message,
    });
  }
});

module.exports = analysisRouter;

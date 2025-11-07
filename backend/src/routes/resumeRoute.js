const express = require("express");
const resumeRouter = express.Router();
const { triggerWorkflow } = require("../services/n8n");
const { parser } = require("../services/parser");

// triggering of the resumeparser.py and n8n happens here and store data in their respective collections
resumeRouter.post("/resume/upload", async (req, res) => {
    try {
        
        const { profilePaths = [] } = req.body;
        const userId = req.user?._id;
        for (const { profile, profilePath } of profilePaths) {
          await triggerWorkflow(userId, profile, profilePath);
        }
        if (req.file?.path) {
          await parser(req.file.path);
        }
      
        return res
          .status(200)
          .json({ success: true, message: "Workflows executed successfully" });
    }
    catch (err) {
        console.error("Error:", err.message);
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




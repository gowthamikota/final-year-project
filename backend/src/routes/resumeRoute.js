const express = require("express");
const resumeRouter = express.Router();
const { triggerWorkflow } = require("./services/n8n");
const parser = require("./python/resumerparser");


// user uploads the resume and enters the submit button
resumeRouter.post("/resume/upload", async (req, res) => {
    
// triggering of the resumeparser.py and n8n happens here and store data in their respective collections
    // after above two process -> preprocess.py file triggers
    try {
        
        const profilePaths = req.body.profilePaths || [];
        const userId = req._id;
        for (const path of profilePaths) {
            await triggerWorkflow(userId, path);
        }

        await parser(resume);
        return res.status(200).json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ error: err.message || err });
    }
});


//gets processed data from the ProcessedData collection and sends this data to analyzeprofile.py file
resumeRouter.get("/resume/:userId", async (req, res) => {
    
});

// delete the uploaded resume of the user
resumeRouter.delete("/resume/:delete", async (req, res) => {
    
});

module.exports = resumeRouter;




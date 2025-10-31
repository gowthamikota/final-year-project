const express = require("express");
const analysisRouter = express.Router();

// triggers by analyse button from frontend and new profile analysis starts from here and this triggers resumeRouter get method to get data
// calls analyzeProfile.py file which contains ML models and stores the data in the db
analysisRouter.post("/analysis/run", async (req, res) => {
    
});

// get all analysis results for a specific user from the db.
analysisRouter.get("/analysis/:userId", async (req, res) => {
    
    // here we provide this analysis results + with job  to LLM along with role temporarly to generate suggestions  and provides to the user
});

// delete analysis
analysisRouter.delete("/analysis/:analysisId", async (req, res) => {
    

});

module.exports = analysisRouter;




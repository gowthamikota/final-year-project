const express = require("express");
const resumeRouter = express.Router();


// user uploads the resume and enters the submit button
resumeRouter.post("/resume/upload", async (req, res) => {
    
    // triggering of the resumeparser.py and n8n happens here and store data in their respective collections
    // after above two process -> preprocess.py file triggers

});


//gets processed data from the ProcessedData collection and sends this data to analyzeprofile.py file
resumeRouter.get("/resume/:userId", async (req, res) => {
    
});

// delete the uploaded resume of the user
resumeRouter.delete("/resume/:delete", async (req, res) => {
    
});

module.exports = resumeRouter;




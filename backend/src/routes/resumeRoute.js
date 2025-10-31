const express = require("express");
const resumeRouter = express.Router();


// user uploads the resume
resumeRouter.post("/resume/upload", async (req, res) => {
    
});

// get the parsed resume data of user
resumeRouter.get("/resume/:userId", async (req, res) => {
    
});

// delete the uploaded resume of the user
resumeRouter.delete("/resume/:delete", async (req, res) => {
    
});


module.exports = resumeRouter;




const express = require("express");
const profileRouter = express.Router();

const { validateEditprofile } = require("../services/validate.js");
const bcrypt = require("bcrypt");

profileRouter.get("/profile/view", async (req, res) => {
  try {
    const user = req.user;
    res.json(user);
  } catch (err) {
    res.status(401).json({ 
      success: false,
      error: "Something went wrong: " + err.message 
    });
  }
});

profileRouter.patch("/profile/update", async (req, res) => {
  try {
    const user = req.user;
    
    // Update user fields from request body
    const allowedUpdates = [
      'firstName', 'lastName', 'degree', 'branch', 'graduationYear',
      'phone', 'location', 'targetRoles', 'skillsToImprove', 
      'preferredLocations', 'resumeFile', 'about', 'age', 'gender', 
      'photoUrl', 'skills'
    ];
    
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        user[key] = req.body[key];
      }
    });

    await user.save();
    
    res.json({ 
      success: true,
      message: "Profile updated successfully",
      user 
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: "Update failed: " + err.message 
    });
  }
});


profileRouter.delete("/profile/delete", async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated"
      });
    }

    // Delete user and all associated data
    const userModel = require("../models/user");
    const resumeDataModel = require("../models/resumeParsedData");
    const combinedDataModel = require("../models/combinedData");
    const githubDataModel = require("../models/githubData");
    const leetcodeDataModel = require("../models/leetcodeData");
    const codeforcesDataModel = require("../models/codeforcesData");
    const codechefDataModel = require("../models/codechefData");
    const finalResultsModel = require("../models/finalResultData");
    const embeddingsModel = require("../models/emdeddings");

    // Delete all associated data
    await Promise.all([
      userModel.findByIdAndDelete(userId),
      resumeDataModel.deleteMany({ userId }),
      combinedDataModel.deleteMany({ userId }),
      githubDataModel.deleteMany({ userId }),
      leetcodeDataModel.deleteMany({ userId }),
      codeforcesDataModel.deleteMany({ userId }),
      codechefDataModel.deleteMany({ userId }),
      finalResultsModel.deleteMany({ userId }),
      embeddingsModel.deleteMany({ userId })
    ]);

    res.json({
      success: true,
      message: "Profile and all associated data deleted successfully"
    });
  } catch (err) {
    console.error("Delete profile error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to delete profile: " + err.message
    });
  }
});

module.exports = profileRouter;

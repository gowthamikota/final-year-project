const express = require("express");
const router = express.Router();
const { userAuth } = require("../middlewares/verifyMiddleware.js");
const { saveLeetCodeProfile } = require("../services/leetcodeService");
const logger = require("../utils/logger");

router.get("/profile/:username", userAuth, async (req, res) => {
  try {
    const username = req.params.username;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: "User not authenticated" 
      });
    }

    const result = await saveLeetCodeProfile(username, userId);
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error("Failed to fetch LeetCode profile", { message: err.message });
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch profile: " + err.message 
    });
  }
});

module.exports = router;

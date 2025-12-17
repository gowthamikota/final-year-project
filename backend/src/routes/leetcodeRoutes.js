const express = require("express");
const router = express.Router();

const { saveLeetCodeProfile } = require("../services/leetcodeService");

router.get("/profile/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const result = await saveLeetCodeProfile(username);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

module.exports = router;

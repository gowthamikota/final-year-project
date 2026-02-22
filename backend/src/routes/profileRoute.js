const express = require("express");
const profileRouter = express.Router();
const bcrypt = require("bcrypt");

const { validateEditprofile } = require("../services/validate.js");

// ---------------- VIEW PROFILE ----------------
profileRouter.get("/profile/view", async (req, res) => {
  try {
    return res.json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ---------------- UPDATE PROFILE ----------------
profileRouter.patch("/profile/update", async (req, res) => {
  try {
    if (!validateEditprofile(req)) {
      return res.status(400).json({
        success: false,
        error: "Invalid update request",
      });
    }

    const user = req.user;

    for (const key of Object.keys(req.body)) {
      if (key === "password") {
        const hashed = await bcrypt.hash(req.body.password, 10);
        user.password = hashed;
      } else {
        user[key] = req.body[key];
      }
    }

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ---------------- DELETE PROFILE ----------------
profileRouter.delete("/profile/delete", async (req, res) => {
  try {
    const user = req.user;

    await user.deleteOne();

    return res.json({
      success: true,
      message: "Account deleted successfully",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = profileRouter;
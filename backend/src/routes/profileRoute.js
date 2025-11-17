const express = require("express");
const profileRouter = express.Router();

const { validateEditprofile } = require("../services/validate.js");
const bcrypt = require("bcrypt");

profileRouter.get("/profile/view", async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(401).send("Something went wrong: " + err.message);
  }
});

profileRouter.patch("/profile/update", async (req, res) => {
  try {
    if (!validateEditprofile(req)) {
      throw new Error("Invalid Update Request");
    }

    const user = req.user;
    Object.keys(req.body).forEach((key) => {
      user[key] = req.body[key];
    });

    await user.save();
    res.send("Profile Updated successfully.");
  } catch (err) {
    res.status(401).send("Something went wrong: " + err.message);
  }
});


profileRouter.delete("/profile/delete", async (req, res) => {
  
});

module.exports = profileRouter;

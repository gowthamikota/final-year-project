const express = require("express");
const authRouter = express.Router();

const { validateSignUpData } = require("../services/validate.js");
const userModel = require("../models/user.js");
const bcrypt = require("bcrypt");
const { validate, schemas } = require("../utils/validator.js");

authRouter.post("/signup", validate(schemas.signup), async (req, res) => {
  try {
    const requestWithValidatedBody = {
      ...req,
      body: req.validatedBody,
    };
    const data = validateSignUpData(requestWithValidatedBody);
    const { firstName, lastName, email, password } = data;
    
    // Don't hash password here - the pre-save hook in user model will do it
    const user = new userModel({
      firstName,
      lastName,
      email,
      password, // Pass plain password, let pre-save hook hash it
    });
    await user.save();
    return res.status(200).json({ success: true, message: "User Created Successfully", user });
  } catch (err) {
    console.error("Error Detected:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

authRouter.post("/login", validate(schemas.login), async (req, res) => {
  try {
    const { email, password } = req.validatedBody;

    // 🔥 IMPORTANT FIX
    const user = await userModel
      .findOne({ email })
      .select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    const token = user.getJWT();
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(200).json({
      success: true,
      user, // password will NOT be included because of toJSON transform
      token,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

authRouter.post("/logout", async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", null, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      expires: new Date(Date.now()),
    });
    res.status(200).json({ success: true, message: "Logout Successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
module.exports = authRouter;

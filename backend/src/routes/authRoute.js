const express = require("express");
const authRouter = express.Router();

const { validateSignUpData } = require("../services/validate.js");
const userModel = require("../models/user.js");
const bcrypt = require("bcrypt");
const { validate, schemas } = require("../utils/validator.js");
const logger = require("../utils/logger");
const { sendSuccess, sendError } = require("../utils/response.js");

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
    return sendSuccess(res, { user }, "User Created Successfully");
  } catch (err) {
    logger.error("Signup error", { message: err.message });
    return sendError(res, err.message, 500);
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
      return sendError(res, "Invalid email or password", 401);
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return sendError(res, "Invalid email or password", 401);
    }

    const token = user.getJWT();
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return sendSuccess(
      res,
      {
        user,
        token,
      },
      "Login successful"
    );

  } catch (err) {
    logger.error("Login error", { message: err.message });
    return sendError(res, "Server error", 500);
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
    return sendSuccess(res, null, "Logout Successfully");
  } catch (err) {
    return sendError(res, err.message, 500);
  }
});
module.exports = authRouter;

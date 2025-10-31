const express = require("express");
const authRouter = express.Router();

const { validateSignUpData } = require("../services/validate.js");
const userModel = require("../models/user.js");
const bcrypt = require("bcrypt");

authRouter.post("/signup", async (req, res) => {
  try {
    const data = validateSignUpData(req);
    const { firstName, lastName, email, password } = data;
    const passwordhash = await bcrypt.hash(password, 10);

    const user = new userModel({
      firstName,
      lastName,
      email,
      password: passwordhash,
    });
    await user.save();
    return res.status(200).send("User Created Successfully");
  } catch (err) {
    console.error("Error Detected:", err.message);
    return res.status(500).send("Error:" + err.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send("Email and password are required.");
    }

    const user = await userModel.findOne({ email: email });
    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await user.validatePassword(password);
    if (isPasswordValid) {
      const token = await user.getJWT();
      const origin = req.headers.origin || "";
      const isLocal = /localhost|127\.0\.0\.1/.test(origin);
      const isProd = !isLocal;

      res.cookie("token", token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      res.send(user);
    } else {
      throw new Error("Invalid password");
    }
  } catch (err) {
    res.status(401).send("Error: " + err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  try {
    const origin = req.headers.origin || "";
    const isLocal = /localhost|127\.0\.0\.1/.test(origin);
    const isProd = !isLocal;
    res.cookie("token", null, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      expires: new Date(Date.now()),
    });
    res.send("Logout Successfully");
  } catch (err) {
    res.send("Error:" + err.message);
  }
});
module.exports = authRouter;

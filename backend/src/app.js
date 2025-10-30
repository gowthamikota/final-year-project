const express = require("express");
const { connectDb } = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/user/authenticate.js");
const profileRouter = require("./routes/user/profile.js");

app.use("/api", authRouter);
app.use("/api", profileRouter);


connectDb()
  .then(() => {
    console.log("Database Connected");
    server.listen(process.env.PORT, () => {
      console.log("Server started on port 1234.....");
    });
  })
  .catch((err) => {
    console.log("Error:", err.message);
  });

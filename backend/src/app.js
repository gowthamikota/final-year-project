const express = require("express");
require("dotenv").config();
const { connectDb } = require("./config/database");
const { userAuth } = require("./middlewares/verifyMiddleware.js");
const cookieParser = require("cookie-parser");
const cors = require("cors");

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

const authRouter = require("./routes/authRoute.js");
const profileRouter = require("./routes/profileRoute.js");
const resumeRouter = require("./routes/resumeRoute.js");
const analysisRouter = require("./routes/analysisRoute.js");

app.use("/api", authRouter);
app.use("/api", userAuth, profileRouter);
app.use("/api", userAuth, resumeRouter);
app.use("/api", userAuth, analysisRouter);


connectDb()
  .then(() => {
    console.log("Database Connected");
    app.listen(process.env.PORT, () => {
      console.log("Server started on port 1234.....");
    });
  })
  .catch((err) => {
    console.log("Error:", err.message);
  });

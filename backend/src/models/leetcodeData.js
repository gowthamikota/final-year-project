const mongoose = require("mongoose");

const leetcodeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    totalSolved: { type: Number, required: true },
    totalSubmissions: {
      difficulty: String,
      count: Number,
      submissions: Number,
    },
    easySolved: { type: Number, required: true },
    mediumSolved: { type: Number, required: true },
    hardSolved: { type: Number, required: true },
    ranking: { type: Number },
    contributionPoint: { type: Number },
    reputation: { type: Number },
  },
  { timestamps: true }
);

const leetcodeModel = mongoose.model("LeetcodeProfile", leetcodeProfileSchema);
module.exports = leetcodeModel;

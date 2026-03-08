const mongoose = require("mongoose");

const analysisHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
      index: true,
    },
    jobRole: {
      type: String,
      default: "",
      trim: true,
    },
    scores: {
      github: { type: Number, default: 0 },
      leetcode: { type: Number, default: 0 },
      codeforces: { type: Number, default: 0 },
      codechef: { type: Number, default: 0 },
      resume: { type: Number, default: 0 },
    },
    finalScore: {
      type: Number,
      default: 0,
    },

    confidenceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("analysishistories", analysisHistorySchema);

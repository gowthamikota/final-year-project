const mongoose = require("mongoose");

const FinalResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
      unique: true,
    },

    scores: {
      github: { type: Number, required: true },
      leetcode: { type: Number, required: true },
      codeforces: { type: Number, required: true },
      codechef: { type: Number, required: true },
      resume: { type: Number, required: true },
      activity: { type: Number, required: true },
    },

    finalScore: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const finalResults = mongoose.model("finalresults", FinalResultSchema);

module.exports = finalResults;

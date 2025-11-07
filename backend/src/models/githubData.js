const mongoose = require("mongoose");

const gitHubDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: { type: String, required: true },
    rank: { type: String },
    totalStars: { type: Number },
    totalCommits: { type: Number },
    totalPRs: { type: Number },
    totalIssues: { type: Number },
    contributedTo: { type: Number },
    streakData: [
      {
        totalContributions: { type: Number },
        currentStreak: { type: Number },
        longestStreak: { type: Number },
      },
    ],
    languageData: [
      {
        languages: [
          {
            language: { type: String },
            percentage: { type: Number },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const githubModel = mongoose.model("GithubProfile", gitHubDataSchema);
module.exports = githubModel;

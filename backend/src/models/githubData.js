const mongoose = require("mongoose");

const gitHubDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  rank: {
    type: String,
  },
  totalStars: {
    type: Number,
  },
  totalCommits: {
    type: Number,
  },
  totalPRs: {
    type: Number,
  },
  totalIssues: {
    type: Number,
  },
  contributedTo: {
    type: Number,
  },
  streakData: [
    {
      totalContributions: {
        type: Number,
      },
      currentStreak: {
        type: Number,
      },
      longestStreak: {
        type: Number,
      },
    },
  ],
  languageData: [
    {
      languages: [
        {
          language: {
            type: String,
          },
          percentage: {
            type: Number,
          },
        },
      ],
    },
  ],
});

module.exports = mongoose.model("githubProfile", gitHubDataSchema);

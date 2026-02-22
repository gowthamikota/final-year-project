const mongoose = require("mongoose");

const combinedDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  github: {
    name: String,
    followers: { type: Number, default: 0 },
    publicRepos: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    totalForks: { type: Number, default: 0 },
    totalPRs: { type: Number, default: 0 },
    totalIssues: { type: Number, default: 0 },
    topLanguages: [{ type: String }],
  },

  leetcode: {
    totalSolved: { type: Number, default: 0 },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },

    ranking: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },

    contestRating: { type: Number, default: 0 },
    contestsAttended: { type: Number, default: 0 },
    contestGlobalRank: { type: Number, default: 0 },
  },

  codeforces: {
    rating: { type: Number, default: 0 },
    maxRating: { type: Number, default: 0 },
    rank: { type: String, default: "" },
    maxRank: { type: String, default: "" },
  },

  codechef: {
    rating: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    contestsParticipated: { type: Number, default: 0 },
    totalProblemsSolved: { type: Number, default: 0 },
    globalRank: { type: Number, default: 0 },
    countryRank: { type: Number, default: 0 },
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const combinedModel = mongoose.model("combineddatas", combinedDataSchema);

module.exports = combinedModel;
const mongoose = require("mongoose");

const combinedDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  codeforces: {
    rating: Number,
    maxRating: Number,
    rank: String,
    maxRank: String,
  },

  codechef: {
    rating: Number,
    contestsParticipated: Number,
    totalProblemsSolved: Number,
    stars: Number,
    ratingConsistency: Number,
  },

  github: {
    totalStars: Number,
    totalCommits: Number,
    totalPRs: Number,
    totalIssues: Number,
    contributedTo: Number,
  },

  leetcode: {
    totalSolved: Number,
    easySolved: Number,
    mediumSolved: Number,
    hardSolved: Number,
    ranking: Number,
  },


  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const combinedModel = mongoose.model("combineddatas", combinedDataSchema);

module.exports = combinedModel;

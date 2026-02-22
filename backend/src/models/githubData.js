const mongoose = require("mongoose");

const gitHubDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: { type: String },

    followers: { type: Number, default: 0 },
    publicRepos: { type: Number, default: 0 },

    totalStars: { type: Number, default: 0 },
    totalForks: { type: Number, default: 0 },

    totalPRs: { type: Number, default: 0 },
    totalIssues: { type: Number, default: 0 },

    topLanguages: [{ type: String }],
  },
  { timestamps: true }
);

const githubModel = mongoose.model("GithubProfile", gitHubDataSchema);
module.exports = githubModel;
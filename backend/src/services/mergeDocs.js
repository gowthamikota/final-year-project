const combinedModel = require("../models/combinedData");
const codechefModel = require("../models/codechefData");
const leetcodeModel = require("../models/leetcodeData");
const githubModel = require("../models/githubData");
const codeforcesModel = require("../models/codeforcesData");

async function mergeData(userId) {
  const cc = await codechefModel.findOne({ userId }).sort({ createdAt: -1 });
  const lc = await leetcodeModel.findOne({ userId }).sort({ createdAt: -1 });
  const gh = await githubModel.findOne({ userId }).sort({ createdAt: -1 });
  const cf = await codeforcesModel.findOne({ userId }).sort({ createdAt: -1 });

  const body = {
    userId,

    github: {
      name: gh?.name || "",
      followers: gh?.followers || 0,
      publicRepos: gh?.publicRepos || 0,
      totalStars: gh?.totalStars || 0,
      totalForks: gh?.totalForks || 0,
      totalPRs: gh?.totalPRs || 0,
      totalIssues: gh?.totalIssues || 0,
      topLanguages: gh?.topLanguages || [],
    },

    leetcode: {
      totalSolved: lc?.totalSolved || 0,
      easySolved: lc?.easySolved || 0,
      mediumSolved: lc?.mediumSolved || 0,
      hardSolved: lc?.hardSolved || 0,

      ranking: lc?.ranking || 0,
      reputation: lc?.reputation || 0,

      contestRating: lc?.contestRating || 0,
      contestsAttended: lc?.contestsAttended || 0,
      contestGlobalRank: lc?.contestGlobalRank || 0,
    },

    codeforces: {
      rating: cf?.rating || 0,
      maxRating: cf?.maxRating || 0,
      rank: cf?.rank || "",
      maxRank: cf?.maxRank || "",
    },

    codechef: {
      rating: cc?.rating || 0,
      stars: cc?.stars || 0,
      contestsParticipated: cc?.contestsParticipated || 0,
      totalProblemsSolved: cc?.totalProblemsSolved || 0,
      globalRank: cc?.globalRank || 0,
      countryRank: cc?.countryRank || 0,
    },

    updatedAt: new Date(),
  };

  const result = await combinedModel.findOneAndUpdate(
    { userId },
    body,
    { upsert: true, new: true }
  );

  console.log("Data merged successfully (upserted)");
  return result;
}

module.exports = { mergeData };
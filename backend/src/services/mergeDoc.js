const combinedModel = require("../models/combinedData");
const codechefModel = require("../models/combinedData");
const leetcodeModel = require("../models/combinedData");
const githubModel = require("../models/combinedData");
const codeforcesModel = require("../models/combinedData");


async function mergeData(userId) {
    const cc = await codechefModel.findOne({ userId }).sort({ createdAt: -1 });
    const lc = await leetcodeModel.findOne({ userId }).sort({ createdAt: -1 });
    const gh = await githubModel.findOne({ userId }).sort({ createdAt: -1 });
    const cf = await codeforcesModel.findOne({ userId }).sort({ createdAt: -1 });


    const body = {
      userId,
      codeforces: {
        rating: cf?.rating || 0,
        maxRating: cf?.maxRating || 0,
        rank: cf?.rank || "",
        maxRank: cf?.maxRank || "",
      },

      codechef: {
        rating: cc?.rating || 0,
        contestsParticipated: cc?.contestsParticipated || 0,
        totalProblemsSolved: cc?.totalProblemsSolved || 0,
        stars: cc?.stars || 0,
        ratingConsistency: cc?.ratingConsistency || 0,
      },
      github: {
        totalStars: gh?.totalStars || 0,
        totalCommits: gh?.totalCommits || 0,
        totalPRs: gh?.totalPRs || 0,
        totalIssues: gh?.totalIssues || 0,
        contributedTo: gh?.contributedTo || 0,
      },
      leetcode: {
        totalSolved: lc?.totalSolved || 0,
        easySolved: lc?.easySolved || 0,
        mediumSolved: lc?.mediumSolved || 0,
        hardSolved: lc?.hardSolved || 0,
        ranking: lc?.ranking || 0,
      },
      updatedAt: new Date(),
    };

    const existing = await combinedModel.findOne({ userId });

    if (existing) {
        await combinedModel.updateOne({ userId }, body);
        console.log("Data combined success")
    }

  const doc = new combinedModel(body);
  await doc.save();
  return body;
}

module.exports = { mergeData };


const mongoose = require("mongoose");

const leetcodeProfileSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model("leetCodeProfile", leetcodeProfileSchema);

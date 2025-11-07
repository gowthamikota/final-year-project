const mongoose = require("mongoose");

const codechefProfileSchema = new mongoose.Schema({
  country: { type: String, required: true },
  rating: { type: Number, required: true },
  contestsParticipated: { type: Number, required: true },
  stars: { type: Number, required: true },
  ranks: { type: Number, required: true },
  totalProblemsSolved: { type: Number, required: true },
  ratingConsistency: { type: Number, required: true },
});

const codechefModel = mongoose.model("codechefProfile", codechefProfileSchema);

module.exports = codechefModel;

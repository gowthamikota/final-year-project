const mongoose = require("mongoose");

const codechefProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    country: { type: String, required: true },
    rating: { type: Number, required: true },
    contestsParticipated: { type: Number, required: true },
    stars: { type: Number, required: true },
    ranks: { type: Number, required: true },
    totalProblemsSolved: { type: Number, required: true },
    ratingConsistency: { type: Number, required: true },
  },
  { timestamps: true }
);

const codechefModel = mongoose.model("CodechefProfile", codechefProfileSchema);
module.exports = codechefModel;

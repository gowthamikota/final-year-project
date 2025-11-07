const mongoose = require("mongoose");

const codeforcesProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: { type: Number },
    rank: { type: String },
    maxRating: { type: Number },
    maxRank: { type: String },
  },
  { timestamps: true }
);

const codeforcesModel = mongoose.model(
  "CodeforcesProfile",
  codeforcesProfileSchema
);
module.exports = codeforcesModel;

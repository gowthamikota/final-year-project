const mongoose = require("mongoose");

const finalResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },

    analysis: {
      skills: [String],
      missingSkills: [String],
      strengths: [String],
      weaknesses: [String],
      keywords: [String],
      summary: String,
     
      profileToResumeScore: Number,

      resumeEmbedding: [Number],
      profileEmbedding: [Number],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const finalResultModel = mongoose.model("finalresults", finalResultSchema);

module.exports = finalResultModel;

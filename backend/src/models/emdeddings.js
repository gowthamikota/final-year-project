const mongoose = require("mongoose");

const EmbeddingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "user",
    },

    github_embed: {
      type: [Number],
      default: [],
    },

    leetcode_embed: {
      type: [Number],
      default: [],
    },

    codeforces_embed: {
      type: [Number],
      default: [],
    },

    codechef_embed: {
      type: [Number],
      default: [],
    },

    resume_embed: {
      type: [Number],
      default: [],
    },

    activity_embed: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("embeddings", EmbeddingSchema);
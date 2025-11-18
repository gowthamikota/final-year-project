const mongoose = require("mongoose");

const EmbeddingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "users",
    },

    github_embed: {
      type: [Number],
      required: true,
    },

    leetcode_embed: {
      type: [Number],
      required: true,
    },

    codeforces_embed: {
      type: [Number],
      required: true,
    },

    codechef_embed: {
      type: [Number],
      required: true,
    },

    resume_embed: {
      type: [Number],
      required: true,
    },

    activity_embed: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("embeddings", EmbeddingSchema);

const mongoose = require("mongoose");

const EmbeddingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "users",
    },

    profileEmbedding: {
      type: [Number],
      required: true,
    },

    resumeEmbedding: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("embeddings", EmbeddingSchema);

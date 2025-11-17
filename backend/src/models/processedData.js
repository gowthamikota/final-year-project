const mongoose = require("mongoose");

const processedDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  vector: {
    type: Object,
    required: true,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const processedModel = mongoose.model("processeddatas", processedDataSchema);

module.exports = processedModel;

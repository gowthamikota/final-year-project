const mongoose = require("mongoose");

const finalResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "users",
    }
  },
  {
    timestamps: true,
  }
);

const finalResultModel = mongoose.model("finalresults", finalResultSchema);

module.exports = finalResultModel;

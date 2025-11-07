const mongoose = require("mongoose");

const resumeDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: String,
    email: String,
    phone: String,
    skills: [String],
    raw_text: String,
    filePath: String,
  },
  { timestamps: true }
);

const resumeDataModel = mongoose.model("ResumeData", resumeDataSchema);
module.exports = resumeDataModel;

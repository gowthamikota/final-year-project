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
    education: [String],
    experience: [String],
    projects: [String],
    certifications: [String],
    achievements: [String],
    raw_text: String,
    filePath: String,
  },
  { timestamps: true }
);

const resumeDataModel = mongoose.model("resumeData", resumeDataSchema, "resumedatas");
module.exports = resumeDataModel;

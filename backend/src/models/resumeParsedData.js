const mongoose = require("mongoose");

const resumeDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", 
      required: true,
    },

    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },

    skills: {
      type: [String],
      default: [],
    },

    experience: {
      type: [String],
      default: [],
    },

    projects: {
      type: [String],
      default: [],
    },

    education: {
      type: [String],
      default: [],
    },

    raw_text: {
      type: String,
      default: "",
    },

    filePath: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const resumeDataModel = mongoose.model("resumedatas", resumeDataSchema);

module.exports = resumeDataModel;
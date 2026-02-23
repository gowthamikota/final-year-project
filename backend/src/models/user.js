const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minLength: 2,
      maxLength: 50,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
      minLength: 2,
      maxLength: 50,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email address");
        }
      },
    },

    password: {
      type: String,
      required: true,
      minLength: 8,
    },

    age: {
      type: Number,
      min: 15,
      default: null,
    },

    gender: {
      type: String,
      enum: ["male", "female", "others"],
      default: null,
    },

    about: {
      type: String,
      default: "",
    },

    photoUrl: {
      type: String,
      default: "",
      validate(value) {
        if (value && !validator.isURL(value)) {
          throw new Error("Invalid photo URL");
        }
      },
    },

    skills: {
      type: [String],
      default: [],
    },

    // Student Profile Information
    degree: {
      type: String,
    },

    branch: {
      type: String,
    },

    graduationYear: {
      type: String,
    },

    phone: {
      type: String,
    },

    location: {
      type: String,
    },

    // Career Preferences
    targetRoles: {
      type: String,
    },

    skillsToImprove: {
      type: String,
    },

    preferredLocations: {
      type: String,
    },

    // Resume Information
    resumeFile: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.index({ firstName: 1, lastName: 1 });



userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const hashed = await bcrypt.hash(this.password, 10);
  this.password = hashed;
  next();
});



userSchema.methods.getJWT = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};



userSchema.methods.validatePassword = function (passwordInput) {
  return bcrypt.compare(passwordInput, this.password);
};

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name."],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Please enter your email address."],
      validate: [validator.isEmail, "Please provide a valid email address"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      minlength: [8, "Minimum length of password is 8"],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please confirm your password"],
      minlength: [8, "Minimum length of password is 8"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Both passwords must be same",
      },
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);
module.exports = User;

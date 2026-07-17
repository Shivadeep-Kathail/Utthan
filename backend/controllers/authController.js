const AppError = require("../utils/appError");
const User = require("../models/userModel");

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      role: req.body.role,
    });

    res.status(201).json({
      status: "success",
      data: {
        newUser,
      },
    });
  } catch (err) {
    next(err);
  }
};

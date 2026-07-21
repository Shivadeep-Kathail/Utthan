const AppError = require("../utils/appError");
const User = require("../models/userModel");

exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-__v -createdAt");
  if (!user) {
    return next(new AppError("User not found!", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
};

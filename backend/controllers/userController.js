const AppError = require('../utils/appError');
const User = require('../models/userModel');
const filterObject = require('../utils/filterObj');

exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found!', 404));
  }
  if (user.isDeleted) {
    return next(new AppError('User is no longer in use.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
};

exports.updateMe = async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword',
        400,
      ),
    );
  }

  const filteredBody = filterObject(req.body, 'name', 'image', 'phone');
  if (Object.keys(filteredBody).length === 0) {
    return next(new AppError('No valid fields provided for update.', 422));
  }

  const user = await User.findOne({
    _id: req.user.id,
    isDeleted: false,
  });
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  Object.assign(user, filteredBody);
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
};

exports.deleteMe = async (req, res, next) => {
  const user = await User.findOne({
    _id: req.user.id,
    isDeleted: false,
  });
  if (!user) {
    return next(new AppError('User not found!', 404));
  }
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.deletedBy = req.user.id;
  await user.save({ validateBeforeSave: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
};

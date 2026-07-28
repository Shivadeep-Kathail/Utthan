const User = require('../models/userModel');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures');

exports.getAllUsers = async (req, res, next) => {
  const features = new ApiFeatures(
    User.find().select('-password -passwordChangedAt -__v'),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;

  res.status(200).json({
    status: 'success',
    page: features.page,
    results: users.length,
    data: {
      users,
    },
  });
};

exports.getDeletedUsers = async (req, res, next) => {
  const features = new ApiFeatures(
    User.find({ isDeleted: true }).select('-password -passwordChangedAt -__v'),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;

  res.status(200).json({
    status: 'success',
    page: features.page,
    results: users.length,
    data: {
      users,
    },
  });
};

exports.getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id).select(
    '-password -passwordChangedAt -__v',
  );
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
};

exports.changeUserRole = async (req, res, next) => {
  const user = await User.findById(req.params.id).select(
    '-password -passwordChangedAt -__v',
  );
  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  const { role } = req.body;
  if (!role) {
    return next(new AppError('Please provide a role.', 400));
  }

  if (user.id === req.user.id) {
    return next(new AppError('You cannot change your own role.', 400));
  }
  if (user.role === role) {
    return next(new AppError(`User is already a ${role}.`, 400));
  }
  if (user.isDeleted) {
    return next(
      new AppError('Recover the user before changing their role.', 400),
    );
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
};

exports.recoverUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found!', 404));
  }
  if (!user.isDeleted) {
    return next(new AppError('Only deleted users can be recovered.', 400));
  }

  user.isDeleted = false;
  user.deletedAt = null;
  user.deletedBy = null;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
};

exports.permanentlyDeleteUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found!', 404));
  }
  if (req.user.id === user.id) {
    return next(
      new AppError('You cannot permanently delete your own account.', 400),
    );
  }
  if (!user.isDeleted) {
    return next(
      new AppError('Only deleted users can be permanently deleted.', 400),
    );
  }
  if (user.role === 'admin') {
    return next(
      new AppError('Admin accounts cannot be permanently deleted.', 403),
    );
  }

  await user.deleteOne();

  res.status(204).end();
};

const AppError = require('../utils/appError');

/**
 * Handle a single image upload.
 *
 * Returns an absolute URL so the frontend (different origin in dev)
 * can render the image without 404-ing against its own origin.
 *
 * Response shape:
 * { status: 'success', data: { url: 'http://localhost:8080/uploads/...' } }
 */
exports.uploadImage = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No image file provided.', 400));
  }

  // Build absolute URL from the current request — works regardless of port
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  res.status(200).json({
    status: 'success',
    data: {
      url,
    },
  });
};

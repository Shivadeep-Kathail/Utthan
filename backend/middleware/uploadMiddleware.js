const multer = require('multer');
const path = require('path');
const AppError = require('../utils/appError');

/**
 * Multer configuration for image uploads.
 *
 * - Stores files in the `uploads/` directory at project root.
 * - Generates unique filenames: `<timestamp>-<random>.ext`
 * - Accepts only image MIME types (jpeg, png, webp, gif).
 * - 5 MB file-size limit.
 */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Only image files are allowed (jpeg, png, webp, gif).',
        400,
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;

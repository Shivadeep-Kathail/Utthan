const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const uploadController = require('../controllers/uploadController');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/upload
 * Protected — requires authentication.
 * Accepts a single file under the field name 'image'.
 */
router.post(
  '/',
  auth.protect,
  upload.single('image'),
  uploadController.uploadImage,
);

module.exports = router;

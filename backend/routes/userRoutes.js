const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Public Routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protected Routes
router.use(auth.protect);

router.get('/me', userController.getMe);
router.patch('/updateMe', userController.updateMe);
router.patch('/updatePassword', authController.updatePassword);
router.delete('/deleteMe', userController.deleteMe);

module.exports = router;

const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/razorpay', paymentController.webhook);

module.exports = router;

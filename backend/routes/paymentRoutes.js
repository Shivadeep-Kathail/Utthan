const express = require('express');
const auth = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

const router = express.Router();
router.use(auth.protect);

router.post('/create-order', paymentController.createOrder);
router.post('/verify-payment', paymentController.verifyPayment);

module.exports = router;

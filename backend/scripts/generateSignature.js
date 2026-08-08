const crypto = require('crypto');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '../config.env'),
});

const orderId = 'order_TNN5Z5MGNGVZfv';
const paymentId = 'pay_test1234567';
const secret = process.env.RAZORPAY_KEY_SECRET;

const signature = crypto
  .createHmac('sha256', secret)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

console.log(signature);

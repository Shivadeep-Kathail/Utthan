const crypto = require('crypto');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '../config.env'),
});

const body = `{
    "event": "payment.captured",
    "payload": {
        "payment": {
            "entity": {
                "id": "pay_test1234567",
                "order_id": "order_TNN5Z5MGNGVZfv"
            }
        }
    }
}`;

const signature = crypto
  .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(body)
  .digest('hex');

console.log('\nSignature:\n');
console.log(signature);

console.log('\nBody:\n');
console.log(body);

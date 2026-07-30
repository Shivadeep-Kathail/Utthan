const express = require('express');
const donationController = require('../controllers/donationController');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth.protect);

router.post('/:campaignId', donationController.createDonation);

module.exports = router;

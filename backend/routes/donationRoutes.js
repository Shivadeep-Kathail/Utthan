const express = require('express');
const donationController = require('../controllers/donationController');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth.protect);

router.post('/:campaignId', donationController.createDonation);
router.get('/me', donationController.getMyDonations);

router.get(
  '/admin',
  auth.requireRole('admin', 'moderator'),
  donationController.getAllDonations,
);
router.get('/:id', donationController.getSingleDonation);

module.exports = router;

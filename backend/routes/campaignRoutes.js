const express = require('express');
const campaignController = require('../controllers/campaignController');
const participationController = require('../controllers/participationController');
const donationController = require('../controllers/donationController');
const auth = require('../middleware/auth');

const router = express.Router();

// Campaign Listing Routes
router
  .route('/')
  .post(auth.protect, campaignController.createCampaign)
  .get(campaignController.getAllCampaigns);

router.get('/my-campaigns', auth.protect, campaignController.getMyCampaigns);

// Participation Routes
router.post(
  '/:campaignId/join',
  auth.protect,
  participationController.joinCampaign,
);
router.delete(
  '/:campaignId/leave',
  auth.protect,
  participationController.leaveCampaign,
);
router.get(
  '/:campaignId/participants',
  auth.protect,
  participationController.viewParticipants,
);

// Donation Routes
router.get(
  '/:campaignId/donations',
  auth.protect,
  donationController.viewDonations,
);

// Campaign Management Routes
router
  .route('/:id')
  .get(campaignController.getCampaign)
  .patch(auth.protect, campaignController.updateCampaign)
  .delete(auth.protect, campaignController.deleteCampaign);

module.exports = router;

const express = require('express');
const campaignController = require('../controllers/campaignController');
const auth = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .post(auth.protect, campaignController.createCampaign)
  .get(campaignController.getAllCampaigns);

router.get('/my-campaigns', auth.protect, campaignController.getMyCampaigns);

router
  .route('/:id')
  .get(campaignController.getCampaign)
  .patch(auth.protect, campaignController.updateCampaign);

module.exports = router;

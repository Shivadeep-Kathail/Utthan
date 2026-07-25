const express = require('express');
const campaignController = require('../controllers/campaignController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth.protect, campaignController.createCampaign);

router.get('/my-campaigns', auth.protect, campaignController.getMyCampaigns);

router.get('/:id', campaignController.getCampaign);

module.exports = router;

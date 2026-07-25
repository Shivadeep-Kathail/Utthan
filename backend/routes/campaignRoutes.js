const express = require('express');
const campaignController = require('../controllers/campaignController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post(
  '/create-campaign',
  auth.protect,
  campaignController.createCampaign,
);

module.exports = router;

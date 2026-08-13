const express = require('express');
const goodsDonationController = require('../controllers/goodsDonationController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth.protect);

router.post('/campaigns/:slug', goodsDonationController.createGoodsDonation);
router.get('/my', goodsDonationController.getMyGoodsDonations);
router.get(
  '/campaigns/:slug',
  goodsDonationController.viewCampaignGoodsDonations,
);
router.get('/:id', goodsDonationController.getGoodsDonation);
router.patch('/:id', goodsDonationController.updateGoodsDonation);
router.patch('/:id/cancel', goodsDonationController.cancelGoodsDonation);
router.patch(
  '/:id/collect',
  goodsDonationController.markGoodsDonationCollected,
);

module.exports = router;

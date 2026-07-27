const express = require('express');
const adminCampaignController = require('../controllers/adminCampaignController');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth.protect, auth.requireRole('admin', 'moderator'));

router.get('/', adminCampaignController.getAllCampaigns);
router.get('/active', adminCampaignController.getAllActiveCampaigns);
router.get('/deleted', adminCampaignController.getAllDeletedCampaigns);
router.get('/flagged', adminCampaignController.getAllFlaggedCampaigns);
router.get('/pending', adminCampaignController.getAllPendingCampaigns);

module.exports = router;

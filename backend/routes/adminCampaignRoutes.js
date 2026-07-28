const express = require('express');
const adminCampaignController = require('../controllers/adminCampaignController');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth.protect, auth.requireRole('admin', 'moderator'));

// Campaign Listing Routes
router.get('/', adminCampaignController.getAllCampaigns);
router.get('/active', adminCampaignController.getAllActiveCampaigns);
router.get('/deleted', adminCampaignController.getAllDeletedCampaigns);
router.get('/flagged', adminCampaignController.getAllFlaggedCampaigns);
router.get('/pending', adminCampaignController.getAllPendingCampaigns);

// Campaign Management Routes
router.patch('/:id/approve', adminCampaignController.approveCampaign);
router.patch('/:id/reject', adminCampaignController.rejectCampaign);
router.patch('/:id/flag', adminCampaignController.flagCampaign);
router.patch('/:id/close', adminCampaignController.closeCampaign);

// Campaign Recovery Routes
router.patch('/:id/restore', adminCampaignController.restoreCampaign);

// Campaign Deletion Routes
router.delete('/:id', adminCampaignController.permanentlyDeleteCampaign);

module.exports = router;

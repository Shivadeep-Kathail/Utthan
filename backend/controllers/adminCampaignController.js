const Campaign = require('../models/campaignModel');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures');

// Campaign Listing
const getCampaignsByQuery = (query) => async (req, res, next) => {
  const features = new ApiFeatures(
    Campaign.find(query).populate('creator', 'name email').lean(),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const campaigns = await features.query;

  res.status(200).json({
    status: 'success',
    results: campaigns.length,
    page: features.page,
    data: {
      campaigns,
    },
  });
};

exports.getAllCampaigns = getCampaignsByQuery({});
exports.getAllDeletedCampaigns = getCampaignsByQuery({ isDeleted: true });
exports.getAllPendingCampaigns = getCampaignsByQuery({ status: 'pending' });
exports.getAllFlaggedCampaigns = getCampaignsByQuery({ status: 'flagged' });
exports.getAllActiveCampaigns = getCampaignsByQuery({
  status: 'active',
  isDeleted: false,
});
exports.getCampaign = async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id).populate(
    'creator',
    'name email',
  );
  if (!campaign) {
    return next(new AppError('No campaign found!', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      campaign,
    },
  });
};

// Campaign Management
const updateCampaignStatus =
  (newStatus, action, requiredStatus = null) =>
  async (req, res, next) => {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return next(new AppError('No campaign found!', 404));
    }

    if (campaign.isDeleted) {
      return next(new AppError(`Cannot ${action} a deleted campaign.`, 400));
    }

    if (requiredStatus && campaign.status !== requiredStatus) {
      return next(
        new AppError(
          `Only ${requiredStatus} campaigns can be ${action}d.`,
          400,
        ),
      );
    }

    campaign.status = newStatus;
    await campaign.save();

    res.status(200).json({
      status: 'success',
      data: {
        campaign,
      },
    });
  };

exports.approveCampaign = updateCampaignStatus('active', 'approve', 'pending');
exports.rejectCampaign = updateCampaignStatus('rejected', 'reject', 'pending');
exports.flagCampaign = updateCampaignStatus('flagged', 'flag', 'active');
exports.closeCampaign = updateCampaignStatus('closed', 'close', 'active');

// Restore Campaign
exports.restoreCampaign = async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    return next(new AppError('No campaign found!', 404));
  }
  if (!campaign.isDeleted) {
    return next(new AppError('Only deleted campaigns can be restored.', 400));
  }

  campaign.isDeleted = false;
  campaign.deletedAt = null;
  campaign.deletedBy = null;
  campaign.status = 'pending';
  await campaign.save();

  res.status(200).json({
    status: 'success',
    data: {
      campaign,
    },
  });
};

// Permanently Delete Campaign
exports.permanentlyDeleteCampaign = async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    return next(new AppError('No campaign found!', 404));
  }
  if (!campaign.isDeleted) {
    return next(
      new AppError('Only deleted campaigns can be permanently deleted', 400),
    );
  }

  await campaign.deleteOne();

  res.status(204).end();
};

const Campaign = require('../models/campaignModel');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures');

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

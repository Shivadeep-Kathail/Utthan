const Campaign = require('../models/campaignModel');
const AppError = require('../utils/appError');

exports.createCampaign = async (req, res, next) => {
  const data = { ...req.body };
  delete data.creator;

  const newCampaign = await Campaign.create({
    ...data,
    creator: req.user.id,
  });
  res.status(201).json({
    status: 'success',
    data: {
      campaign: newCampaign,
    },
  });
};

exports.getCampaign = async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    return next(new AppError('No campaign found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      campaign,
    },
  });
};

exports.getMyCampaigns = async (req, res, next) => {
  const campaigns = await Campaign.find({ creator: req.user.id });

  res.status(200).json({
    status: 'success',
    results: campaigns.length,
    data: {
      campaigns,
    },
  });
};

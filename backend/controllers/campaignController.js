const Campaign = require('../models/campaignModel');
const AppError = require('../utils/appError');

exports.createCampaign = async (req, res, next) => {
  const newCampaign = await Campaign.create({
    ...req.body,
    creator: req.user.id,
  });
  res.status(201).json({
    status: 'success',
    data: {
      campaign: newCampaign,
    },
  });
};

const Campaign = require('../models/campaignModel');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures');
const filterObject = require('../utils/filterObj');

exports.createCampaign = async (req, res, next) => {
  const data = { ...req.body };
  delete data.creator;
  delete data.status;

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
  const campaign = await Campaign.findById(req.params.id).populate(
    'creator',
    'name email',
  );
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

exports.getAllCampaigns = async (req, res, next) => {
  const features = new ApiFeatures(
    Campaign.find().populate('creator', 'name'),
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

exports.updateCampaign = async (req, res, next) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    return next(new AppError('No Campaign found!', 404));
  }
  if (
    campaign.creator.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new AppError('Permission to update campaign denied!', 403));
  }

  const filteredBody = filterObject(
    req.body,
    'title',
    'description',
    'category',
    'coverImage',
    'images',
    'location',
  );

  if (Object.keys(filteredBody).length === 0) {
    return next(new AppError('No valid fields provided for update.', 400));
  }

  // Aternative for making another query with findByIdAndUpdate
  Object.assign(campaign, filteredBody);
  await campaign.save();

  res.status(200).json({
    status: 'success',
    data: {
      campaign,
    },
  });
};

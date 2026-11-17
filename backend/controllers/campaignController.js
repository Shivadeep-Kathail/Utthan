const Campaign = require('../models/campaignModel');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures');
const filterObject = require('../utils/filterObj');

exports.createCampaign = async (req, res, next) => {
  const data = { ...req.body };
  delete data.creator;
  delete data.status;

  // Reject payoutDetails for non-fundraising campaigns
  if (data.type !== 'fundraising') {
    delete data.payoutDetails;
  }

  const newCampaign = await Campaign.create({
    ...data,
    creator: req.user.id,
  });

  const responseObj = newCampaign.toObject();
  delete responseObj.payoutDetails;

  res.status(201).json({
    status: 'success',
    data: {
      campaign: responseObj,
    },
  });
};

exports.getCampaign = async (req, res, next) => {
  const campaign = await Campaign.findOne({
    slug: req.params.slug,
    isDeleted: false,
  }).populate('creator', 'name email');
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
  const campaigns = await Campaign.find({
    creator: req.user.id,
    isDeleted: false,
  });

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
    Campaign.find({
      isDeleted: false,
      status: { $in: ['active', 'closed'] },
    }).populate('creator', 'name'),
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
  const campaign = await Campaign.findOne({
    slug: req.params.slug,
    isDeleted: false,
  });
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
    'payoutDetails',
  );

  // Only allow payoutDetails updates for fundraising campaigns
  if (campaign.type !== 'fundraising') {
    delete filteredBody.payoutDetails;
  }

  if (Object.keys(filteredBody).length === 0) {
    return next(new AppError('No valid fields provided for update.', 422));
  }

  // Aternative for making another query with findByIdAndUpdate
  Object.assign(campaign, filteredBody);
  await campaign.save();

  const responseObj = campaign.toObject();
  delete responseObj.payoutDetails;

  res.status(200).json({
    status: 'success',
    data: {
      campaign: responseObj,
    },
  });
};

exports.deleteCampaign = async (req, res, next) => {
  const campaign = await Campaign.findOne({
    slug: req.params.slug,
    isDeleted: false,
  });
  if (!campaign) {
    return next(new AppError('No Campaign found!', 404));
  }
  if (campaign.creator.toString() !== req.user.id) {
    return next(
      new AppError('Only the campaign creator can delete this campaign.', 403),
    );
  }

  campaign.isDeleted = true;
  campaign.deletedAt = new Date();
  campaign.deletedBy = req.user.id;
  await campaign.save();

  res.status(204).json({
    status: 'success',
    data: null,
  });
};

exports.getPayoutDetails = async (req, res, next) => {
  const campaign = await Campaign.findOne({
    slug: req.params.slug,
    isDeleted: false,
  }).select('+payoutDetails');

  if (!campaign) {
    return next(new AppError('No campaign found', 404));
  }

  // Only the campaign creator or an admin can view payout details
  if (
    campaign.creator.toString() !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(
      new AppError('You do not have permission to view payout details', 403),
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      payoutDetails: campaign.payoutDetails || null,
    },
  });
};

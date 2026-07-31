const Donation = require('../models/donationModel');
const Campaign = require('../models/campaignModel');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.createDonation = async (req, res, next) => {
  const data = { ...req.body };
  delete data.donor;
  delete data.campaign;
  delete data.status;

  if (!data.amount || data.amount <= 0) {
    return next(new AppError('Please provide a valid donation amount.', 400));
  }

  const campaign = await Campaign.findOne({
    _id: req.params.campaignId,
    isDeleted: false,
  });
  if (!campaign) {
    return next(new AppError('Campaign not found.', 404));
  }
  if (campaign.status !== 'active') {
    return next(new AppError('This campaign is not accepting donations.', 400));
  }
  if (campaign.type !== 'fundraising') {
    return next(
      new AppError(
        'Monetary donations can only be made to fundraising campaigns.',
        400,
      ),
    );
  }

  const donation = await Donation.create({
    ...data,
    donor: req.user.id,
    campaign: campaign._id,
  });

  campaign.amountRaised += donation.amount;
  if (campaign.amountRaised >= campaign.amountNeeded) {
    campaign.status = 'closed';
  }
  await campaign.save();

  res.status(201).json({
    status: 'success',
    data: {
      donation,
    },
  });
};

exports.getMyDonations = async (req, res, next) => {
  const donations = await Donation.find({
    donor: req.user.id,
  }).populate('campaign', 'title');

  res.status(200).json({
    status: 'success',
    results: donations.length,
    data: {
      donations,
    },
  });
};

exports.getAllDonations = async (req, res, next) => {
  const features = new ApiFeatures(
    Donation.find().populate('donor', 'name email').populate({
      path: 'campaign',
      select: 'title status isDeleted',
    }),
    req.query,
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const donations = await features.query;

  res.status(200).json({
    status: 'success',
    results: donations.length,
    page: features.page,
    data: {
      donations,
    },
  });
};

exports.getSingleDonation = async (req, res, next) => {
  const donation = await Donation.findById(req.params.id)
    .populate({
      path: 'campaign',
      select: 'title creator status',
      populate: {
        path: 'creator',
        select: 'name',
      },
    })
    .populate('donor', 'name email');
  if (!donation) {
    return next(new AppError('Donation not found', 404));
  }

  const isDonor = donation.donor._id.toString() === req.user.id;
  const isCreator = donation.campaign.creator._id.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isDonor && !isCreator && !isAdmin) {
    return next(
      new AppError('You have no permission to view this donation', 403),
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      donation,
    },
  });
};

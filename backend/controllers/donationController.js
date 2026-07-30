const Donation = require('../models/donationModel');
const Campaign = require('../models/campaignModel');
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
    campaign,
  });

  res.status(201).json({
    status: 'success',
    data: {
      donation,
    },
  });
};

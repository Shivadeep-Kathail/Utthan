const razorpay = require('../config/razorpay.config');

const Campaign = require('../models/campaignModel');
const Donation = require('../models/donationModel');
const AppError = require('../utils/appError');

exports.createOrder = async (req, res, next) => {
  const { campaign, amount } = req.body;
  const donor = req.user.id;

  if (!amount || amount <= 0) {
    return next(new AppError('Please provide a valid donation amount.', 400));
  }

  const campaignDoc = await Campaign.findById(campaign);
  if (!campaignDoc) {
    return next(new AppError('Campaign not found.', 404));
  }
  if (campaignDoc.type !== 'fundraising') {
    return next(
      new AppError('Campaign does not accept monetary donations.', 400),
    );
  }
  if (campaignDoc.status !== 'active') {
    return next(new AppError('Campaign is not active.', 400));
  }
  if (campaignDoc.creator.equals(req.user.id)) {
    return next(new AppError('You cannot donate to your own campaign.', 400));
  }

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: `campaign-${campaignDoc._id}-${Date.now()}`,
  });

  const donation = await Donation.create({
    donor,
    campaign: campaignDoc._id,
    amount,
    razorpayOrderId: order.id,
    status: 'created',
  });
  res.status(201).json({
    status: 'success',
    data: {
      order,
      donationId: donation.id,
    },
  });
};

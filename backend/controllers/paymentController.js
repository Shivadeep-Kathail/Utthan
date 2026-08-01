const razorpay = require('../config/razorpay.config');
const crypto = require('crypto');

const Campaign = require('../models/campaignModel');
const Donation = require('../models/donationModel');
const AppError = require('../utils/appError');

exports.createOrder = async (req, res, next) => {
  try {
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
      receipt: `${campaignDoc._id.toString().slice(-8)}-${Date.now()}`,
      notes: {
        campaignId: campaignDoc._id.toString(),
        donorId: donor.toString(),
      },
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
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 'error',
      message: err.message,
      error: err,
    });
  }
};

exports.verifyPayment = async (req, res, next) => {
  const { order_id, payment_id, signature } = req.body;

  const donation = await Donation.findOne({ razorpayOrderId: order_id });
  if (!donation) {
    return next(new AppError('Donation not found.', 404));
  }
  if (donation.status === 'captured') {
    return res.status(200).json({
      status: 'success',
      message: 'Payment already verified.',
    });
  }

  const secretKey = process.env.RAZORPAY_KEY_SECRET;
  const generatedSign = crypto
    .createHmac('sha256', secretKey)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');
  if (generatedSign !== signature) {
    return next(new AppError('Invalid payment signature.', 400));
  }

  donation.status = 'captured';
  donation.razorpayPaymentId = payment_id;
  donation.paidAt = new Date();
  await donation.save();

  const campaign = await Campaign.findByIdAndUpdate(
    donation.campaign,
    { $inc: { amountRaised: donation.amount } },
    { new: true },
  );
  if (!campaign) {
    return next(new AppError('Campaign not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Payment Verified successfully',
    data: {
      donation,
    },
  });
};

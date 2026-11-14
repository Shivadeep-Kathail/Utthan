const mongoose = require('mongoose');
const GoodsDonation = require('../models/GoodsDonationModel');
const Campaign = require('../models/campaignModel');
const AppError = require('../utils/appError');

const findCampaignItem = (campaign, itemName) => {
  return campaign.items.find(
    (item) => item.name.toLowerCase() === itemName.toLowerCase(),
  );
};

const getPledgedQuantities = async (campaignId, excludeDonationId = null) => {
  const match = {
    campaign: campaignId,
    status: 'pledged',
  };
  if (excludeDonationId) {
    match._id = { $ne: excludeDonationId };
  }

  const pledged = await GoodsDonation.aggregate([
    { $match: match },
    { $unwind: '$items' },
    {
      $group: {
        _id: { $toLower: '$items.item' },
        quantity: { $sum: '$items.quantity' },
      },
    },
  ]);

  return new Map(pledged.map((item) => [item._id, item.quantity]));
};

const validateDonationItems = async (
  campaign,
  items,
  excludeDonationId = null,
) => {
  const pledgedQuantities = await getPledgedQuantities(
    campaign._id,
    excludeDonationId,
  );

  for (const donationItem of items) {
    const campaignItem = findCampaignItem(campaign, donationItem.item);
    if (!campaignItem) {
      return `"${donationItem.item}" is not required by this campaign.`;
    }

    const totalPledged =
      pledgedQuantities.get(donationItem.item.toLowerCase()) || 0;

    const remaining =
      campaignItem.needed - campaignItem.received - totalPledged;

    if (donationItem.quantity > remaining) {
      return `Only ${remaining} ${campaignItem.name} are still available for pledge.`;
    }
  }

  return null;
};

exports.createGoodsDonation = async (req, res, next) => {
  const { address, items, preferredCollectionDate } = req.body;

  const campaign = await Campaign.findOne({
    slug: req.params.slug,
    isDeleted: false,
  });
  if (!campaign) {
    return next(new AppError('Campaign not found.', 404));
  }
  if (campaign.status !== 'active') {
    return next(new AppError('This campaign is not accepting donations.', 400));
  }
  if (campaign.type !== 'goods-donation') {
    return next(
      new AppError(
        'Goods donations can only be made to goods-donation campaigns.',
        400,
      ),
    );
  }

  const validationError = await validateDonationItems(campaign, items);
  if (validationError) {
    return next(new AppError(validationError, 400));
  }

  const donation = await GoodsDonation.create({
    donor: req.user.id,
    campaign: campaign._id,
    address,
    items,
    preferredCollectionDate,
  });

  res.status(201).json({
    status: 'success',
    data: {
      donation,
    },
  });
};

exports.getMyGoodsDonations = async (req, res, next) => {
  const donations = await GoodsDonation.find({
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

exports.getGoodsDonation = async (req, res, next) => {
  const donation = await GoodsDonation.findById(req.params.id).populate({
    path: 'campaign',
    select: 'title creator status',
    populate: {
      path: 'creator',
      select: 'name',
    },
  });

  if (!donation) {
    return next(new AppError('Donation not found.', 404));
  }

  const isDonor = donation.donor.equals(req.user.id);
  const isCreator = donation.campaign.creator._id.equals(req.user.id);
  if (!isDonor && !isCreator) {
    return next(
      new AppError('You are not authorized to view this donation.', 403),
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      donation,
    },
  });
};

exports.viewCampaignGoodsDonations = async (req, res, next) => {
  const campaign = await Campaign.findOne({
    slug: req.params.slug,
    isDeleted: false,
  });
  if (!campaign) {
    return next(new AppError('Campaign not found.', 404));
  }
  if (!campaign.creator.equals(req.user.id) && req.user.role !== 'admin') {
    return next(
      new AppError(
        'Only campaign creator or admin can view all donations of this campaign.',
        403,
      ),
    );
  }

  const donations = await GoodsDonation.find({
    campaign: campaign._id,
  })
    .select('donor items address status preferredCollectionDate createdAt')
    .populate('donor', 'name');

  res.status(200).json({
    status: 'success',
    results: donations.length,
    data: {
      donations,
    },
  });
};

exports.updateGoodsDonation = async (req, res, next) => {
  const { address, items, preferredCollectionDate } = req.body;

  const donation = await GoodsDonation.findById(req.params.id);
  if (!donation) {
    return next(new AppError('Donation not found.', 404));
  }
  if (!donation.donor.equals(req.user.id)) {
    return next(
      new AppError('You can only update your own goods donation.', 403),
    );
  }
  if (donation.status !== 'pledged') {
    return next(
      new AppError('Only pledged goods donations can be updated.', 400),
    );
  }

  const campaign = await Campaign.findOne({
    _id: donation.campaign,
    isDeleted: false,
  });
  if (!campaign) {
    return next(new AppError('Campaign not found.', 404));
  }
  if (campaign.status !== 'active') {
    return next(new AppError('This campaign is not accepting donations.', 400));
  }

  if (address !== undefined) {
    if (!address.trim()) {
      return next(new AppError('Address cannot be empty.', 400));
    }

    donation.address = address.trim();
  }

  if (items !== undefined) {
    if (!Array.isArray(items) || items.length === 0) {
      return next(new AppError('Items must contain at least one item.', 400));
    }

    const validationError = await validateDonationItems(
      campaign,
      items,
      donation._id,
    );
    if (validationError) {
      return next(new AppError(validationError, 400));
    }

    donation.items = items;
  }

  if (preferredCollectionDate !== undefined) {
    const date = new Date(preferredCollectionDate);
    if (isNaN(date.getTime()) || date <= new Date()) {
      return next(
        new AppError(
          'Preferred collection date must be a valid future date.',
          400,
        ),
      );
    }

    donation.preferredCollectionDate = date;
  }

  await donation.save();

  res.status(200).json({
    status: 'success',
    data: {
      donation,
    },
  });
};

exports.cancelGoodsDonation = async (req, res, next) => {
  const donation = await GoodsDonation.findById(req.params.id);
  if (!donation) {
    return next(new AppError('Donation not found.', 404));
  }
  if (!donation.donor.equals(req.user.id)) {
    return next(
      new AppError('You can only cancel your own goods donation.', 403),
    );
  }
  if (donation.status !== 'pledged') {
    return next(new AppError('Only pledged goods can be cancelled.', 400));
  }

  donation.status = 'cancelled';
  await donation.save();

  res.status(200).json({
    status: 'success',
    data: {
      donation,
    },
  });
};

exports.markGoodsDonationCollected = async (req, res, next) => {
  const donation = await GoodsDonation.findById(req.params.id);
  if (!donation) {
    return next(new AppError('Donation not found.', 404));
  }
  if (donation.status === 'cancelled') {
    return next(new AppError('Cancelled donation cannot be collected.', 400));
  }
  if (donation.status === 'collected') {
    return next(
      new AppError('Collected donation cannot be collected again.', 400),
    );
  }

  const campaign = await Campaign.findOne({
    _id: donation.campaign,
    isDeleted: false,
  });
  if (!campaign) {
    return next(new AppError('Campaign not found.', 404));
  }
  if (!campaign.creator.equals(req.user.id)) {
    return next(
      new AppError(
        'Only campaign creator can mark this donation collected.',
        403,
      ),
    );
  }

  // Use a transaction to ensure the donation status change and campaign
  // item increments succeed or fail together. Within the transaction,
  // use atomic $inc to avoid lost-update races when concurrent collects
  // both read the same stale received value.
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // 1. Atomically increment each campaign item's received count.
      //    Using $inc avoids the read-modify-write race where two
      //    concurrent collects load the same received value, both add
      //    their quantity, and the last save overwrites the first.
      for (const donationItem of donation.items) {
        const campaignItem = findCampaignItem(campaign, donationItem.item);
        if (campaignItem) {
          await Campaign.updateOne(
            { _id: campaign._id, 'items.name': campaignItem.name },
            { $inc: { 'items.$.received': donationItem.quantity } },
            { session },
          );
        }
      }

      // 2. Mark the donation as collected (after the increment, so a
      //    failure in step 1 doesn't leave a "collected" donation
      //    whose items were never counted).
      donation.status = 'collected';
      await donation.save({ session });
    });
  } finally {
    await session.endSession();
  }

  // Re-read the campaign so the response includes the latest received
  // counts (the in-memory campaign object is stale after $inc).
  const updatedCampaign = await Campaign.findById(campaign._id);

  res.status(200).json({
    status: 'success',
    data: {
      donation,
    },
  });
};

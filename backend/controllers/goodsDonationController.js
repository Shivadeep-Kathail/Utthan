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
    _id: req.params.campaignId,
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
    _id: req.params.campaignId,
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

  const validationError = await validateDonationItems(
    campaign,
    items,
    donation._id,
  );
  if (validationError) {
    return next(new AppError(validationError, 400));
  }

  donation.address = address;
  donation.items = items;
  donation.preferredCollectionDate = preferredCollectionDate;
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

  for (const donationItem of donation.items) {
    const campaignItem = findCampaignItem(campaign, donationItem.item);
    if (campaignItem) {
      campaignItem.received += donationItem.quantity;
    }
  }

  donation.status = 'collected';
  await donation.save();
  await campaign.save();

  res.status(200).json({
    status: 'success',
    data: {
      donation,
    },
  });
};

const Participation = require('../models/participationModel');
const Campaign = require('../models/campaignModel');
const AppError = require('../utils/appError');

exports.joinCampaign = async (req, res, next) => {
  const campaign = await Campaign.findOne({
    slug: req.params.slug,
    isDeleted: false,
  });
  if (!campaign) {
    return next(new AppError('Campaign not found.', 404));
  }
  if (campaign.status !== 'active') {
    return next(
      new AppError('This campaign is not accepting participants.', 400),
    );
  }
  if (campaign.type !== 'participation') {
    return next(
      new AppError('You can only join or leave participation campaigns.', 400),
    );
  }
  if (campaign.creator.equals(req.user.id)) {
    return next(new AppError('You cannot join your own campaign.', 400));
  }
  if (
    campaign.participantGoal &&
    campaign.participantCount >= campaign.participantGoal
  ) {
    return next(new AppError('Participant limit reached.', 400));
  }

  const alreadyJoined = await Participation.exists({
    participant: req.user.id,
    campaign: campaign._id,
  });
  if (alreadyJoined) {
    return next(new AppError('You have already joined this campaign.', 409));
  }

  const participant = await Participation.create({
    campaign: campaign._id,
    participant: req.user.id,
  });

  await campaign.updateOne({
    $inc: { participantCount: 1 },
  });

  res.status(201).json({
    status: 'success',
    data: {
      participant,
    },
  });
};

exports.leaveCampaign = async (req, res, next) => {
  const campaign = await Campaign.findOne({
    slug: req.params.slug,
    isDeleted: false,
  });
  if (!campaign) {
    return next(new AppError('Campaign not found.', 404));
  }
  if (campaign.type !== 'participation') {
    return next(
      new AppError('You can only join or leave participation campaigns.', 400),
    );
  }

  const alreadyJoined = await Participation.exists({
    participant: req.user.id,
    campaign: campaign._id,
  });
  if (!alreadyJoined) {
    return next(
      new AppError('You cannot leave the campaign without joining it.', 409),
    );
  }

  await Participation.findOneAndDelete({
    participant: req.user.id,
    campaign: campaign._id,
  });

  await campaign.updateOne({
    $inc: { participantCount: -1 },
  });

  res.status(200).json({
    status: 'success',
    message: 'Campaign left successfully',
  });
};

exports.viewParticipants = async (req, res, next) => {
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
        'Only the campaign creator or admin can view participants.',
        403,
      ),
    );
  }

  const participants = await Participation.find({
    campaign: campaign._id,
  }).populate('participant', 'name');

  res.status(200).json({
    status: 'success',
    result: participants.length,
    data: {
      participants,
    },
  });
};

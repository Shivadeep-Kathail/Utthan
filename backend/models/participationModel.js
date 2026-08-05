const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A participant must be a user'],
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'A participant must belong to a campaign.'],
    },
  },
  {
    timestamps: true,
  },
);

participationSchema.index({ participant: 1, campaign: 1 }, { unique: true });

const Participation = mongoose.model('Participation', participationSchema);
module.exports = Participation;

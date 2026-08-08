const mongoose = require('mongoose');

const goodsDonationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A donation must have a donor'],
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'A donation must belong to a campaign'],
    },
    address: {
      type: String,
      required: [true, 'Collection address is required'],
      trim: true,
    },
    items: {
      type: [
        {
          item: {
            type: String,
            required: [true, 'Item name is required'],
            trim: true,
          },
          quantity: {
            type: Number,
            required: [true, 'Item quantity is required'],
            min: [1, 'Quantity must be at least 1'],
          },
        },
      ],
      validate: {
        validator: (items) => items.length > 0,
        message: 'At least one item is required.',
      },
    },
    status: {
      type: String,
      enum: ['pledged', 'collected', 'cancelled'],
      default: 'pledged',
    },
    preferredCollectionDate: {
      type: Date,
      required: [true, 'Preferred collection date is required'],
      validate: {
        validator: function (date) {
          return date > new Date();
        },
        message: 'Preferred collection date must be in the future.',
      },
    },
  },
  {
    timestamps: true,
  },
);

const GoodsDonation = mongoose.model('GoodsDonation', goodsDonationSchema);

module.exports = GoodsDonation;

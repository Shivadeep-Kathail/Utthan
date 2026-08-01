const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A donation must have a donor.'],
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'A donation must belong to a campaign.'],
    },
    amount: {
      type: Number,
      required: [true, 'A donation must have an amount'],
      min: [1, 'Donation amount should be at least 1.'],
    },
    currency: {
      type: String,
      enum: ['INR'],
      default: 'INR',
      required: [true, 'A donation must have a valid currency'],
    },
    status: {
      type: String,
      enum: ['created', 'captured', 'failed', 'refunded'],
      default: 'created',
    },
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    razorpaySignature: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    receipt: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    failureReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

donationSchema.index({ donor: 1 });
donationSchema.index({ campaign: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ createdAt: -1 });

const Donation = mongoose.model('Donation', donationSchema);
module.exports = Donation;

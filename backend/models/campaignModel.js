const mongoose = require('mongoose');
const slugify = require('slugify');

const payoutDetailsSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['upi', 'bank'],
      required: [true, 'Payout method is required'],
    },
    upiId: { type: String, trim: true },
    accountHolderName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifsc: { type: String, trim: true, uppercase: true },
  },
  { _id: false },
);

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please enter Campaign name.'],
      minlength: [10, 'Campaign title must be at least 10 characters'],
      maxlength: [100, 'Campaign title cannot exceed 100 characters'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A Campaign must have a creator'],
      immutable: true,
    },
    description: {
      type: String,
      required: [true, 'A Campaign must have a description'],
      minlength: [50, 'Campaign description should be at least 50 chars'],
      maxlength: [1000, 'Campaign description cannot be more than 1000 chars'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['fundraising', 'participation', 'goods-donation'],
      default: 'fundraising',
    },
    amountNeeded: {
      type: Number,
      required: function () {
        return this.type === 'fundraising';
      },
      min: 1,
    },
    amountRaised: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (value) {
          return this.amountNeeded == null || value <= this.amountNeeded;
        },
        message: 'Amount raised cannot exceed amount needed.',
      },
    },
    participantGoal: {
      type: Number,
      required: function () {
        return this.type === 'participation';
      },
      min: 1,
    },
    participantCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    items: {
      type: [
        {
          _id: false,
          name: {
            type: String,
            required: true,
            trim: true,
          },
          needed: {
            type: Number,
            required: true,
            min: 1,
          },
          received: {
            type: Number,
            default: 0,
            min: 0,
            validate: {
              validator: function (value) {
                return value <= this.needed;
              },
              message: 'Received items cannot exceed needed items.',
            },
          },
        },
      ],
      required: function () {
        return this.type === 'goods-donation';
      },
    },
    category: {
      type: String,
      enum: [
        'medical',
        'education',
        'social',
        'animal-welfare',
        'disaster-relief',
        'women-empowerment',
        'child-welfare',
        'environment',
        'community-development',
        'other',
      ],
      required: [true, 'A Campaign must belong to a category'],
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'closed', 'flagged', 'rejected'],
      default: 'pending',
    },
    coverImage: {
      type: String,
      required: [true, 'A Campaign should have a cover image'],
    },
    images: {
      type: [String],
      default: [],
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        required: [true, 'A Campaign must have a location'],
        validate: {
          validator: (arr) =>
            Array.isArray(arr) &&
            arr.length === 2 &&
            arr[0] >= -180 &&
            arr[0] <= 180 &&
            arr[1] >= -90 &&
            arr[1] <= 90,
          message: 'Coordinates must be [longitude, latitude].',
        },
      },
      address: {
        type: String,
        required: [true, 'A Campaign must have an address'],
      },
      description: {
        type: String,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    payoutDetails: {
      type: payoutDetailsSchema,
      select: false,
      required: [
        function () {
          return this.type === 'fundraising';
        },
        'Payout details are required for fundraising campaigns',
      ],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
campaignSchema.index({ location: '2dsphere' });
campaignSchema.index({ creator: 1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ type: 1 });
campaignSchema.index({ createdAt: -1 });

campaignSchema.pre('validate', function () {
  // Skip if no payoutDetails or not fundraising
  if (!this.payoutDetails) return;

  const pd = this.payoutDetails;

  if (pd.method === 'upi') {
    if (!pd.upiId || !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(pd.upiId)) {
      this.invalidate('payoutDetails.upiId', 'Invalid UPI ID format');
    }
    // Clear bank fields
    pd.accountHolderName = undefined;
    pd.accountNumber = undefined;
    pd.ifsc = undefined;
  } else if (pd.method === 'bank') {
    if (!pd.accountHolderName || !pd.accountHolderName.trim()) {
      this.invalidate(
        'payoutDetails.accountHolderName',
        'Account holder name is required for bank transfers',
      );
    }
    if (!pd.accountNumber || !/^\d{9,18}$/.test(pd.accountNumber)) {
      this.invalidate(
        'payoutDetails.accountNumber',
        'Account number must be 9-18 digits',
      );
    }
    if (!pd.ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(pd.ifsc.toUpperCase())) {
      this.invalidate('payoutDetails.ifsc', 'Invalid IFSC code format');
    }
    // Clear UPI field
    pd.upiId = undefined;
  }
});

campaignSchema.pre('save', async function () {
  if (!this.isNew) return;

  const baseSlug = slugify(this.title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 2;
  while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  this.slug = slug;
});

campaignSchema.virtual('fundingProgress').get(function () {
  if (this.type !== 'fundraising') return null;

  return (this.amountRaised / this.amountNeeded) * 100;
});

campaignSchema.virtual('participationProgress').get(function () {
  if (this.type !== 'participation') return null;

  return (this.participantCount / this.participantGoal) * 100;
});

campaignSchema.virtual('goodsProgress').get(function () {
  if (this.type !== 'goods-donation') return null;

  const needed = this.items.reduce((sum, item) => sum + item.needed, 0);
  const received = this.items.reduce((sum, item) => sum + item.received, 0);

  return (received / needed) * 100;
});

const Campaign = mongoose.model('Campaign', campaignSchema);
module.exports = Campaign;

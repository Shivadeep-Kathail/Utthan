const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please enter Campaign name.'],
      minlength: [10, 'Campaign title must be at least 10 characters'],
      maxlength: [100, 'Campaign title cannot exceed 100 characters'],
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

const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please enter Campaign name.'],
      trim: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A Campaign must have a creator'],
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
      enum: ['pending', 'active', 'closed', 'flagged'],
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
        validate: {
          validator: (arr) => Array.isArray(arr) && arr.length === 2,
          message: 'Coordinates must contain longitude and latitude.',
        },
        required: [true, 'A Campaign must have a location'],
      },
      address: {
        type: String,
        required: [true, 'A Campaign must have a address'],
      },
      description: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
campaignSchema.index({ location: '2dsphere' });

campaignSchema.pre(/^find/, function () {
  this.populate('creator', 'name email');
});

const Campaign = mongoose.model('Campaign', campaignSchema);
module.exports = Campaign;

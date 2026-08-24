const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../config.env') });

const Campaign = require('../models/campaignModel');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PWD);

const arg = process.argv[2];

if (!arg) {
  console.error('Usage: node scripts/approveCampaign.js <slug>  |  --all');
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(DB);
  console.log('DB Connected');

  if (arg === '--all') {
    const result = await Campaign.updateMany(
      { status: { $nin: ['active', 'closed'] }, isDeleted: false },
      { $set: { status: 'active' } }
    );
    console.log(`Promoted ${result.modifiedCount} campaign(s) to 'active'.`);
  } else {
    const campaign = await Campaign.findOneAndUpdate(
      { slug: arg },
      { status: 'active' },
      { new: true }
    );
    if (!campaign) {
      console.log(`No campaign found with slug "${arg}".`);
    } else {
      console.log(`"${campaign.title}" (${campaign.slug}) → status: ${campaign.status}`);
    }
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
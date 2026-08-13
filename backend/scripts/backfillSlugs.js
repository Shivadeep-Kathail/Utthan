const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const slugify = require('slugify');

dotenv.config({ path: path.join(__dirname, '../config.env') });

const Campaign = require('../models/campaignModel');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PWD);

const backfillSlugs = async () => {
  await mongoose.connect(DB);
  console.log('DB Connected');

  const campaigns = await Campaign.find({ $or: [{ slug: null }, { slug: '' }, { slug: { $exists: false } }] });

  if (campaigns.length === 0) {
    console.log('No campaigns need slug backfill.');
    return;
  }

  console.log(`Found ${campaigns.length} campaign(s) without slugs.\n`);

  let updated = 0;
  let failed = 0;

  for (const campaign of campaigns) {
    const baseSlug = slugify(campaign.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 2;
    while (await Campaign.findOne({ slug, _id: { $ne: campaign._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    campaign.slug = slug;

    try {
      await campaign.save({ validateBeforeSave: false });
      console.log(`  ✔ "${campaign.title}" → ${slug}`);
      updated++;
    } catch (err) {
      console.error(`  ✘ "${campaign.title}" failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nBackfill complete: ${updated} updated, ${failed} failed.`);
};

backfillSlugs()
  .catch((err) => {
    console.error('Backfill error:', err.message);
    process.exit(1);
  })
  .finally(() => {
    mongoose.disconnect();
  });

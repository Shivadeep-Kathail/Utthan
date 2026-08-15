const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../config.env') });

const Campaign = require('../models/campaignModel');
const Donation = require('../models/donationModel');
const User = require('../models/userModel');
const campaignController = require('../controllers/campaignController');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PWD);

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  ✔ ${label}`);
    passed++;
  } else {
    console.error(`  ✘ ${label}`);
    failed++;
  }
}

async function runTests() {
  await mongoose.connect(DB);
  console.log('DB Connected\n');

  // Clean up any previous test data
  await Campaign.deleteMany({ title: /^Test Slug Verify/ });

  const creator = await User.findOne();
  if (!creator) {
    console.error('No user found in DB to act as campaign creator. Aborting.');
    return;
  }

  const campaignData = {
    description: 'This is a test description that needs to be at least 50 characters long to pass validation requirements.',
    creator: creator._id,
    category: 'medical',
    type: 'fundraising',
    amountNeeded: 10000,
    coverImage: 'test-cover.png',
    location: { coordinates: [77.5946, 12.9716], address: 'Bangalore, India' },
  };

  try {
    // --- Test 1: Campaign creation generates slug ---
    console.log('1. Campaign Creation');
    const c1 = await Campaign.create({
      ...campaignData,
      title: 'Test Slug Verify Help Rohan Fight Cancer',
    });
    check('Slug generated from title', c1.slug === 'test-slug-verify-help-rohan-fight-cancer');
    check('MongoDB _id still exists', !!c1._id);

    // --- Test 2: Duplicate titles get unique slugs ---
    console.log('\n2. Duplicate Titles');
    const c2 = await Campaign.create({
      ...campaignData,
      title: 'Test Slug Verify Help Rohan Fight Cancer',
    });
    check('Second campaign gets "-2" suffix', c2.slug === 'test-slug-verify-help-rohan-fight-cancer-2');

    const c3 = await Campaign.create({
      ...campaignData,
      title: 'Test Slug Verify Help Rohan Fight Cancer',
    });
    check('Third campaign gets "-3" suffix', c3.slug === 'test-slug-verify-help-rohan-fight-cancer-3');

    // --- Test 3: Retrieval by slug via controller ---
    console.log('\n3. Campaign Retrieval by Slug');
    let retrievedCampaign = null;
    const req = { params: { slug: c1.slug } };
    const res = {
      status() { return this; },
      json(data) { retrievedCampaign = data; },
    };
    const next = () => {};
    await campaignController.getCampaign(req, res, next);
    check('Controller resolves correct campaign', retrievedCampaign?.data?.campaign?._id.toString() === c1._id.toString());

    // --- Test 4: Invalid slug returns 404 ---
    console.log('\n4. Invalid Slug');
    let errorReceived = null;
    const reqBad = { params: { slug: 'this-slug-does-not-exist-anywhere' } };
    const resBad = { status() { return this; }, json() {} };
    const nextBad = (err) => { errorReceived = err; };
    await campaignController.getCampaign(reqBad, resBad, nextBad);
    check('Returns 404 AppError for nonexistent slug', errorReceived?.statusCode === 404);

    // --- Test 5: Internal relationships use _id ---
    console.log('\n5. Internal Relationships');
    const donation = await Donation.create({
      donor: creator._id,
      campaign: c1._id,
      amount: 500,
      currency: 'INR',
    });
    check('Donation.campaign stores ObjectId (_id)', donation.campaign.toString() === c1._id.toString());
    check('Donation.campaign is NOT the slug', donation.campaign.toString() !== c1.slug);

    // --- Test 6: Title update does NOT change slug ---
    console.log('\n6. Title Update Does NOT Change Slug');
    const originalSlug = c1.slug;
    c1.title = 'Test Slug Verify Updated Campaign Title Here';
    await c1.save();
    check('Slug unchanged after title edit', c1.slug === originalSlug);

    console.log('\n6b. Three Consecutive Title Edits');
    c1.title = 'Test Slug Verify Edit Two';
    await c1.save();
    c1.title = 'Test Slug Verify Edit Three';
    await c1.save();
    c1.title = 'Test Slug Verify Edit Four';
    await c1.save();
    check('Slug unchanged after multiple title edits', c1.slug === originalSlug);

    // --- Test 7: Non-title save does not change slug ---
    console.log('\n7. Non-Title Save Preserves Slug');
    const slugBefore = c2.slug;
    c2.description = 'Updated description that is still at least 50 characters long to pass validation requirements.';
    await c2.save();
    check('Slug unchanged after non-title update', c2.slug === slugBefore);

  } catch (err) {
    console.error('\nTest error:', err.message);
    console.error(err.stack);
  } finally {
    // Cleanup
    await Donation.deleteMany({ campaign: { $in: await Campaign.find({ title: /^Test Slug Verify/ }).distinct('_id') } });
    await Campaign.deleteMany({ title: /^Test Slug Verify/ });
    await mongoose.disconnect();
    console.log(`\n=============================`);
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log(`=============================`);
  }
}

runTests();

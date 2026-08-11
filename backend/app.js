const express = require('express');
const cookieParser = require('cookie-parser');

const userRouter = require('./routes/userRoutes');
const campaignRouter = require('./routes/campaignRoutes');
const adminCampaignRouter = require('./routes/adminCampaignRoutes');
const adminUserRouter = require('./routes/adminUserRoutes');
const donationRouter = require('./routes/donationRoutes');
const paymentRouter = require('./routes/paymentRoutes');
const webhookRouter = require('./routes/webhookRoutes');
const goodsDonationRouter = require('./routes/goodsDonationRoutes');

const app = express();
app.use(
  '/api/webhooks',
  express.raw({ type: 'application/json' }),
  webhookRouter,
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Utthan API running',
  });
});

app.set('query parser', 'extended');

app.use('/api/users', userRouter);
app.use('/api/campaign', campaignRouter);
app.use('/api/donations', donationRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/admin/campaigns', adminCampaignRouter);
app.use('/api/admin/users', adminUserRouter);
app.use('/api/goods-donations', goodsDonationRouter);

module.exports = app;

const express = require('express');
const cookieParser = require('cookie-parser');

const userRouter = require('./routes/userRoutes');
const campaignRouter = require('./routes/campaignRoutes');
const adminCampaignRouter = require('./routes/adminCampaignRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const donationRoutes = require('./routes/donationRoutes');

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Utthan API running',
  });
});

app.use('/api/users', userRouter);
app.use('/api/campaign', campaignRouter);
app.use('/api/donations', donationRoutes);
app.use('/api/admin/campaigns', adminCampaignRouter);
app.use('/api/admin/users', adminUserRoutes);

module.exports = app;

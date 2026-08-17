const express = require('express');
const cookieParser = require('cookie-parser');

const cors = require('cors');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const rateLimiter = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const xss = require('xss');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const userRouter = require('./routes/userRoutes');
const campaignRouter = require('./routes/campaignRoutes');
const adminCampaignRouter = require('./routes/adminCampaignRoutes');
const adminUserRouter = require('./routes/adminUserRoutes');
const donationRouter = require('./routes/donationRoutes');
const paymentRouter = require('./routes/paymentRoutes');
const webhookRouter = require('./routes/webhookRoutes');
const goodsDonationRouter = require('./routes/goodsDonationRoutes');

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: 'http://localhost:8081',
    credentials: true,
  }),
);

app.set('query parser', 'extended');

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
});

app.use('/api', apiLimiter);

app.use(
  '/api/webhooks',
  express.raw({ type: 'application/json' }),
  webhookRouter,
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use(mongoSanitize());

const xssOptions = {
  whiteList: {},
};

app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach(sanitize);
      return;
    }

    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key], xssOptions);
      } else if (obj[key] && typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    });
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);

  next();
});

app.use(hpp());

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Utthan API running',
  });
});

app.use('/api/users', userRouter);
app.use('/api/campaign', campaignRouter);
app.use('/api/donations', donationRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/admin/campaigns', adminCampaignRouter);
app.use('/api/admin/users', adminUserRouter);
app.use('/api/goods-donations', goodsDonationRouter);

app.all('/*splat', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

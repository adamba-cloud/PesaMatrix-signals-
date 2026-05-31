import express from 'express';
import cors from 'cors';
import { AuthController } from './modules/auth/auth.controller';
import { AdminController } from './modules/admin/admin.controller';
import { apiLimiter } from './middleware/rateLimiter';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const app = express();
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const billingQueue = new Queue('billing-queue', { connection: redisConnection });

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', AuthController);
app.use('/api/v1/admin', AdminController);

app.post('/api/v1/payments/mpesa-callback', async (req, res) => {
  const { Body } = req.body;
  
  await billingQueue.add(`mpesa_${Body.stkCallback.CheckoutRequestID}`, {
    CheckoutRequestID: Body.stkCallback.CheckoutRequestID,
    ResultCode: Body.stkCallback.ResultCode,
    mpesaRef: Body.stkCallback.CallbackMetadata?.Item?.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value
  });

  res.status(200).send({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });
});

export default app;

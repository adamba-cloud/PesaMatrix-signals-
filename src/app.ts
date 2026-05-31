import express from 'express';
import cors from 'cors';
import { AuthController } from './modules/auth/auth.controller';
import { AdminController } from './modules/admin/admin.controller';
import { apiLimiter } from './middleware/rateLimiter';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', AuthController);
app.use('/api/v1/admin', AdminController);

app.post('/api/v1/payments/mpesa-callback', async (req, res) => {
  const { Body } = req.body;
  if (!Body?.stkCallback) {
    return res.status(400).json({ error: 'Invalid callback payload' });
  }
  try {
    const { Queue } = await import('bullmq');
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const billingQueue = new Queue('billing-queue', { connection: { url: redisUrl } });
    await billingQueue.add(`mpesa_${Body.stkCallback.CheckoutRequestID}`, {
      CheckoutRequestID: Body.stkCallback.CheckoutRequestID,
      ResultCode: Body.stkCallback.ResultCode,
      mpesaRef: Body.stkCallback.CallbackMetadata?.Item?.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value,
    });
  } catch (err: any) {
    console.warn('Could not enqueue billing callback:', err.message);
  }
  res.status(200).send({ ResultCode: 0, ResultDesc: 'Callback processed' });
});

export default app;

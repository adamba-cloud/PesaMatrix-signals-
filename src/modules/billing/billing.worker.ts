import { Worker, Job } from 'bullmq';
import { MpesaService } from './mpesa.service';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Use a silent connection that doesn't retry endlessly when Redis is unavailable
const connection = {
  url: redisUrl,
  maxRetriesPerRequest: null as any,
  enableReadyCheck: false,
  retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 1000, 5000)),
  reconnectOnError: () => false,
};

export const billingWorker = new Worker(
  'billing-queue',
  async (job: Job) => {
    const { CheckoutRequestID, ResultCode, mpesaRef } = job.data;
    await MpesaService.processCallback(CheckoutRequestID, ResultCode, mpesaRef);
  },
  { connection }
);

billingWorker.on('failed', (job, err) => {
  console.error(`[BillingWorker] Job ${job?.id} failed:`, err.message);
});

billingWorker.on('error', () => {}); // suppress connection noise

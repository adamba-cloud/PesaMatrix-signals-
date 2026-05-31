import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../../config/database';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export const billingWorker = new Worker(
  'billing-queue',
  async (job: Job) => {
    const { CheckoutRequestID, ResultCode, CallbackMetadata, mpesaRef } = job.data;

    if (ResultCode === 0) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      await prisma.$transaction(async (tx) => {
        const sub = await tx.subscription.update({
          where: { checkoutId: CheckoutRequestID },
          data: {
            status: 'COMPLETED',
            mpesaRef: mpesaRef,
            expiresAt: expiry
          }
        });

        await tx.auditLog.create({
          data: {
            userId: sub.userId,
            action: `SUBSCRIPTION_ACTIVATED_MPESA:${mpesaRef}`
          }
        });
      });
    } else {
      await prisma.subscription.update({
        where: { checkoutId: CheckoutRequestID },
        data: { status: 'FAILED' }
      });
    }
  },
  { connection: redisConnection }
);

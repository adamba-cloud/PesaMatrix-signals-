import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { metaApi } from './metaapi.service';
import { prisma } from '../../config/database';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export const copyExecutionWorker = new Worker(
  'copy-trade-queue',
  async (job: Job) => {
    const { action, symbol, side, volume, stopLoss, takeProfit, ticket } = job.data;

    const config = await prisma.systemConfig.findUnique({ where: { id: 'PESAMATRIX_CONFIG' } });
    if (config?.killSwitchActive) return;

    const activeSlaves = await prisma.mt5Account.findMany({
      where: { accountType: 'SLAVE', status: 'CONNECTED' },
      include: { user: { include: { subscriptions: true } } }
    });

    const activeExecutingSlaves = activeSlaves.filter(slave => 
      slave.user.subscriptions.some(sub => sub.status === 'COMPLETED' && sub.expiresAt && sub.expiresAt > new Date())
    );

    await Promise.allSettled(
      activeExecutingSlaves.map(async (slave) => {
        try {
          const connection = metaApi.getMetatraderConnection(slave.metaId);
          if (!connection.synchronized) await connection.connect();
          
          if (action === 'OPEN') {
            const result = await connection.createMarketOrder(symbol, side, volume, stopLoss, takeProfit);
            await prisma.tradeLog.create({
              data: { accountId: slave.id, ticket: result.orderId.toString(), symbol, type: side, lots: volume, price: result.price, sl: stopLoss, tp: takeProfit, status: 'SUCCESS' }
            });
          }
        } catch (err: any) {
          await prisma.tradeLog.create({
            data: { accountId: slave.id, ticket: 'FAILED', symbol, type: side, lots: volume, price: 0, status: 'FAILED', errorMessage: err.message }
          });
        }
      })
    );
  },
  { connection: redisConnection, concurrency: 50 }
);

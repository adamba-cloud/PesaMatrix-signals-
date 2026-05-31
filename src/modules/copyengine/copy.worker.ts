import { Worker, Job } from 'bullmq';
import { metaApi } from './metaapi.service';
import { prisma } from '../../config/database';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const connection = {
  url: redisUrl,
  maxRetriesPerRequest: null as any,
  enableReadyCheck: false,
  retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 1000, 5000)),
  reconnectOnError: () => false,
};

export const copyExecutionWorker = new Worker(
  'copy-trade-queue',
  async (job: Job) => {
    const { action, symbol, side, volume, stopLoss, takeProfit } = job.data;

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
          const account = await metaApi.metatraderAccountApi.getAccount(slave.metaId);
          const connection = account.getRPCConnection();
          await connection.connect();
          await connection.waitSynchronized();
          
          if (action === 'OPEN') {
            const result = await (connection as any).createMarketOrder(symbol, side, volume, stopLoss, takeProfit);
            await prisma.tradeLog.create({
              data: { accountId: slave.id, ticket: (result as any).orderId?.toString() ?? 'UNKNOWN', symbol, type: side, lots: volume, price: (result as any).price ?? 0, sl: stopLoss, tp: takeProfit, status: 'SUCCESS' }
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
  { connection, concurrency: 50 }
);

copyExecutionWorker.on('error', () => {}); // suppress connection noise

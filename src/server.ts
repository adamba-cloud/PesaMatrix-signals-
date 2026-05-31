import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  // Attempt to start Telegram bot (non-fatal if token is invalid)
  try {
    const { bot } = await import('./modules/telegram/bot.service');
    bot.launch().catch((err: any) => {
      console.warn('⚠️  Telegram bot stopped (invalid token or network):', err.message);
    });
    console.log('🤖 Telegram Realtime Control Bot actively mapping hooks...');
  } catch (err: any) {
    console.warn('⚠️  Telegram bot skipped (check TELEGRAM_BOT_TOKEN):', err.message);
  }

  // Attempt to start BullMQ workers (non-fatal if Redis is unavailable)
  try {
    const { billingWorker } = await import('./modules/billing/billing.worker');
    const { copyExecutionWorker } = await import('./modules/copyengine/copy.worker');
    billingWorker.on('completed', (job) => console.log(`Completed payment processing job ${job.id}`));
    copyExecutionWorker.on('completed', (job) => console.log(`Completed order execution loop ${job.id}`));
    console.log('⚙️  BullMQ workers online.');
  } catch (err: any) {
    console.warn('⚠️  BullMQ workers skipped (check REDIS_URL):', err.message);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 PesaMatrix Execution Platform listening on standard port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});

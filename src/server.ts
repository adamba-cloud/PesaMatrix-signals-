import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { bot } from './modules/telegram/bot.service';
import { billingWorker } from './modules/billing/billing.worker';
import { copyExecutionWorker } from './modules/copyengine/copy.worker';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  bot.launch();
  console.log('🤖 Telegram Realtime Control Bot actively mapping hooks...');

  billingWorker.on('completed', (job) => console.log(`Completed payment processing job ${job.id}`));
  copyExecutionWorker.on('completed', (job) => console.log(`Completed order execution loop ${job.id}`));

  app.listen(PORT, () => {
    console.log(`🚀 PesaMatrix Execution Platform listening on standard port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});

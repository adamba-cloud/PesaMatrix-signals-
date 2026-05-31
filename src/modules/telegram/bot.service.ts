import { Telegraf, Markup } from 'telegraf';
import { Queue } from 'bullmq';
import { prisma } from '../../config/database';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const copyQueue = new Queue('copy-trade-queue', { connection: { url: redisUrl } });
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

bot.start((ctx) => ctx.reply('PESAMATRIX Cloud Infrastructure Control Engine Activated.'));

export async function broadcastSignalForApproval(signalData: any) {
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID!;
  const message = `🚨 *AI MARKET GENERATED SIGNAL*\n\n` +
                  `Symbol: ${signalData.symbol}\n` +
                  `Action: ${signalData.decision}\n` +
                  `SMC Framework: ${signalData.metrics.smcStructure}\n` +
                  `Candle Conf: ${signalData.metrics.candleConfirmation}\n` +
                  `EMA 200 Filter: ${signalData.metrics.ema200Trend}\n` +
                  `Current Market Spread: ${signalData.metrics.spread} pips`;

  await bot.telegram.sendMessage(adminChatId, message, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      Markup.button.callback('🚀 Approve & Broadcast', `APPROVE_${signalData.symbol}_${signalData.decision}`),
      Markup.button.callback('❌ Reject Signal', 'REJECT_SIGNAL')
    ])
  });
}

bot.action(/^APPROVE_(.*)_(.*)$/, async (ctx) => {
  const [, symbol, action] = ctx.match;
  
  const config = await prisma.systemConfig.findUnique({ where: { id: 'PESAMATRIX_CONFIG' } });
  if (config?.killSwitchActive) {
    return ctx.answerCbQuery('Action Blocked: Master Kill-Switch is ACTIVE.');
  }

  await copyQueue.add(`trade_${symbol}_${Date.now()}`, {
    action: 'OPEN',
    symbol,
    side: action === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
    volume: 0.10,
    stopLoss: 0,
    takeProfit: 0
  });

  await ctx.editMessageText(`✅ *Signal Approved and Dispatched to Queues:* ${action} ${symbol}`, { parse_mode: 'Markdown' });
});

bot.action('REJECT_SIGNAL', async (ctx) => {
  await ctx.editMessageText('❌ *Signal rejected by risk officer.*', { parse_mode: 'Markdown' });
});

export { bot };

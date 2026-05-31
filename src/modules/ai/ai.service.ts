import axios from 'axios';

export interface MarketMetrics {
  symbol: string;
  smcStructure: 'BOS' | 'CHoCH' | 'RANGING';
  candleConfirmation: 'ENGULFING' | 'PINBAR' | 'NEUTRAL';
  ema200Trend: 'BULLISH' | 'BEARISH';
  spread: number;
  volatilityIndex: number;
}

export class AiMarketAssistant {
  static async evaluateMarketSignal(symbol: string): Promise<{ decision: 'BUY' | 'SELL' | 'HOLD'; metrics: MarketMetrics }> {
    const externalAnalysisUrl = process.env.AI_ENGINE_ENDPOINT || 'https://pesamatrix.com';
    const response = await axios.post(externalAnalysisUrl, { symbol });
    const data: MarketMetrics = response.data;

    let score = 0;

    if (data.smcStructure === 'BOS') score += 70;
    if (data.candleConfirmation === 'ENGULFING') score += 20;
    if (data.ema200Trend === 'BULLISH') score += 10;

    let decision: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    if (score >= 70 && data.ema200Trend === 'BULLISH') decision = 'BUY';
    if (score >= 70 && data.ema200Trend === 'BEARISH') decision = 'SELL';

    return { decision, metrics: data };
  }
}

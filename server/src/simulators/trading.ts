import { TradingTick } from "../types";

interface Instrument {
  symbol: string;
  price: number;
  prevClose: number;
  volatility: number;
}

const instruments: Instrument[] = [
  { symbol: "BTC/USD", price: 62_400, prevClose: 62_400, volatility: 55 },
  { symbol: "ETH/USD", price: 3_150, prevClose: 3_150, volatility: 6 },
  { symbol: "VN30F1M", price: 1_285, prevClose: 1_285, volatility: 1.8 },
  { symbol: "AAPL", price: 221.4, prevClose: 221.4, volatility: 0.35 },
  { symbol: "SOL/USD", price: 142.8, prevClose: 142.8, volatility: 1.1 },
];

function gaussianNoise() {
  // Box-Muller transform for a more natural-looking price walk than uniform noise.
  const u = Math.random() || 1e-9;
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function tickTrading(): TradingTick[] {
  return instruments.map((inst) => {
    const move = gaussianNoise() * inst.volatility * 0.08;
    inst.price = Math.max(0.01, inst.price + move);
    const change = inst.price - inst.prevClose;
    const changePercent = (change / inst.prevClose) * 100;
    return {
      symbol: inst.symbol,
      price: Number(inst.price.toFixed(2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
      timestamp: Date.now(),
    };
  });
}

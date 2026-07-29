import dynamic from 'next/dynamic';
import { useState } from 'react';

// O lightweight-charts precisa do objeto window, então desativamos o SSR
const TradingChart = dynamic(() => import('@/components/TradingChart'), { ssr: false });

export default function GraficoPage() {
  const [ativo, setAtivo] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('15m');

  return (
    <div className="animate-in h-full flex flex-col">
      <div className="page-header mb-6">
        <div>
          <h1>Análise SMC (Futuros)</h1>
          <p className="page-subtitle">Visualização de Candlesticks</p>
        </div>
        
        <div className="flex gap-4">
          <select 
            value={ativo}
            onChange={(e) => setAtivo(e.target.value)}
            className="bg-bg-secondary border border-glass-border rounded px-4 py-2 text-white font-medium"
          >
            <option value="BTCUSDT">BTC/USDT</option>
            <option value="ETHUSDT">ETH/USDT</option>
            <option value="SOLUSDT">SOL/USDT</option>
            <option value="BNBUSDT">BNB/USDT</option>
          </select>

          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-bg-secondary border border-glass-border rounded px-4 py-2 text-white font-medium"
          >
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
          </select>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[600px]">
        <TradingChart symbol={ativo} interval={timeframe} />
      </div>
    </div>
  );
}

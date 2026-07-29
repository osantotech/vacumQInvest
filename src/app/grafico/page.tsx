'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import CalculadoraRisco from '@/components/CalculadoraRisco';

// O lightweight-charts precisa do objeto window, então desativamos o SSR
const TradingChart = dynamic(
  () => import('@/components/TradingChart'),
  { ssr: false }
);

export default function GraficoPage() {
  const [ativo, setAtivo] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('15m');

  return (
    <div className="animate-in h-full flex flex-col">
      <div className="page-header mb-4">
        <div>
          <h1>Análise SMC (Futuros)</h1>
          <p className="page-subtitle">Visualização Tick-by-Tick e Gestão de Risco</p>
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

      {/* Cockpit de Trading (Calculadora + Gráfico) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', flex: 1, minHeight: '650px' }}>
        {/* Barra Lateral da Calculadora */}
        <div style={{ width: '100%', maxWidth: '340px', flexShrink: 0 }}>
          <CalculadoraRisco currentPrice={0} />
        </div>

        {/* Gráfico Principal */}
        <div style={{ flex: 1, minWidth: '300px', minHeight: '500px' }}>
          <TradingChart symbol={ativo} interval={timeframe} />
        </div>
      </div>
    </div>
  );
}

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
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', minHeight: '80vh' }}>
      
      {/* Header Area */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>Análise SMC (Futuros)</h1>
          <p className="page-subtitle">Visualização Tick-by-Tick e Gestão de Risco</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select 
            value={ativo}
            onChange={(e) => setAtivo(e.target.value)}
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 16px', color: '#fff', fontWeight: 600, outline: 'none' }}
          >
            <option value="BTCUSDT">BTC/USDT</option>
            <option value="ETHUSDT">ETH/USDT</option>
            <option value="SOLUSDT">SOL/USDT</option>
            <option value="BNBUSDT">BNB/USDT</option>
          </select>

          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '8px 16px', color: '#fff', fontWeight: 600, outline: 'none' }}
          >
            <option value="15m">15m</option>
            <option value="30m">30m</option>
            <option value="2h">2h</option>
            <option value="4h">4h</option>
          </select>
        </div>
      </div>

      {/* Cockpit Layout */}
      <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
        
        {/* Barra Lateral (Esquerda) - Calculadora */}
        <div style={{ width: '320px', flexShrink: 0 }}>
          <CalculadoraRisco currentPrice={0} />
        </div>

        {/* Gráfico Principal (Direita) */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
            <TradingChart symbol={ativo} interval={timeframe} />
          </div>
        </div>

      </div>
    </div>
  );
}

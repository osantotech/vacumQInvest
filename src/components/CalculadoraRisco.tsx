'use client';

import React, { useState, useEffect } from 'react';

interface CalculadoraRiscoProps {
  currentPrice: number;
}

export default function CalculadoraRisco({ currentPrice }: CalculadoraRiscoProps) {
  const [capital, setCapital] = useState<number>(1000);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [tipo, setTipo] = useState<'LONG' | 'SHORT'>('LONG');
  const [alavancagem, setAlavancagem] = useState<number>(10);
  
  const [entryPrice, setEntryPrice] = useState<number | ''>('');
  const [stopLoss, setStopLoss] = useState<number | ''>('');
  const [takeProfit, setTakeProfit] = useState<number | ''>('');

  // Results
  const [positionSizeAsset, setPositionSizeAsset] = useState<number>(0);
  const [positionSizeUSD, setPositionSizeUSD] = useState<number>(0);
  const [marginRequired, setMarginRequired] = useState<number>(0);
  const [potentialLoss, setPotentialLoss] = useState<number>(0);
  const [potentialProfit, setPotentialProfit] = useState<number>(0);
  const [rrRatio, setRrRatio] = useState<number>(0);

  // Auto-fill entry price if empty when currentPrice changes
  useEffect(() => {
    if (entryPrice === '' && currentPrice > 0) {
      setEntryPrice(currentPrice);
    }
  }, [currentPrice]);

  useEffect(() => {
    if (capital <= 0 || riskPercent <= 0 || !entryPrice || !stopLoss) {
      setPositionSizeAsset(0);
      setPositionSizeUSD(0);
      setMarginRequired(0);
      setPotentialLoss(0);
      setPotentialProfit(0);
      setRrRatio(0);
      return;
    }

    const riskAmount = capital * (riskPercent / 100);
    const entry = Number(entryPrice);
    const stop = Number(stopLoss);
    const tp = Number(takeProfit);

    // Stop Loss % distance
    const stopDistancePercent = Math.abs(entry - stop) / entry;

    if (stopDistancePercent === 0) return;

    // Calculo do tamanho da posição (sem considerar alavancagem para o tamanho total)
    // Risk = PositionSize * StopDistance
    // PositionSize = Risk / StopDistance
    const totalPositionUSD = riskAmount / stopDistancePercent;
    const qtyAsset = totalPositionUSD / entry;
    
    // Margin needed based on leverage
    const margin = totalPositionUSD / alavancagem;

    setPositionSizeAsset(qtyAsset);
    setPositionSizeUSD(totalPositionUSD);
    setMarginRequired(margin);
    setPotentialLoss(riskAmount);

    if (tp) {
      const tpDistancePercent = Math.abs(tp - entry) / entry;
      const profit = totalPositionUSD * tpDistancePercent;
      setPotentialProfit(profit);
      setRrRatio(profit / riskAmount);
    } else {
      setPotentialProfit(0);
      setRrRatio(0);
    }
  }, [capital, riskPercent, tipo, alavancagem, entryPrice, stopLoss, takeProfit]);

  return (
    <div className="bg-bg-secondary border border-glass-border rounded-xl p-5 flex flex-col gap-4 shadow-lg w-full max-w-sm h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Calculadora de Risco
        </h2>
      </div>

      {/* Capital e Risco */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase">Capital Total ($)</label>
          <input 
            type="number" 
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            className="w-full bg-bg-primary border border-glass-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase">Risco (%)</label>
          <div className="relative">
            <input 
              type="number" 
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              step="0.1"
              className="w-full bg-bg-primary border border-glass-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent transition-colors pr-8"
            />
            <span className="absolute right-3 top-2.5 text-text-muted">%</span>
          </div>
        </div>
      </div>

      {/* Tipo e Alavancagem */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase">Tipo</label>
          <div className="flex rounded-lg overflow-hidden border border-glass-border">
            <button 
              onClick={() => setTipo('LONG')}
              className={`flex-1 py-2 text-xs font-bold transition-colors ${tipo === 'LONG' ? 'bg-green text-white' : 'bg-bg-primary text-text-muted hover:bg-glass'}`}
            >
              LONG
            </button>
            <button 
              onClick={() => setTipo('SHORT')}
              className={`flex-1 py-2 text-xs font-bold transition-colors ${tipo === 'SHORT' ? 'bg-red text-white' : 'bg-bg-primary text-text-muted hover:bg-glass'}`}
            >
              SHORT
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase">Alavancagem</label>
          <div className="relative">
            <input 
              type="number" 
              value={alavancagem}
              onChange={(e) => setAlavancagem(Number(e.target.value))}
              className="w-full bg-bg-primary border border-glass-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-accent transition-colors pr-8"
            />
            <span className="absolute right-3 top-2.5 text-text-muted">x</span>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-glass-border my-1"></div>

      {/* Preços */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase">Preço de Entrada</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-text-muted">$</span>
            <input 
              type="number" 
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-bg-primary border border-glass-border rounded-lg pl-7 pr-3 py-2 text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="Ex: 63400.50"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase">Stop Loss</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-text-muted">$</span>
            <input 
              type="number" 
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-bg-primary border border-red/50 rounded-lg pl-7 pr-3 py-2 text-white focus:outline-none focus:border-red transition-colors"
              placeholder="Obrigatório"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1 font-medium uppercase">Take Profit (Opcional)</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-text-muted">$</span>
            <input 
              type="number" 
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-bg-primary border border-green/50 rounded-lg pl-7 pr-3 py-2 text-white focus:outline-none focus:border-green transition-colors"
              placeholder="Opcional"
            />
          </div>
        </div>
      </div>

      {/* Resultados da Calculadora */}
      <div className="mt-2 bg-bg-primary rounded-lg p-4 border border-glass-border">
        <h3 className="text-sm font-semibold text-text-primary mb-3 text-center">Tamanho da Posição</h3>
        
        <div className="flex justify-between items-end mb-4">
          <span className="text-3xl font-bold text-accent">{positionSizeAsset > 0 ? positionSizeAsset.toFixed(4) : '0.00'}</span>
          <span className="text-sm text-text-muted mb-1">Contratos</span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Tamanho Total:</span>
            <span className="font-medium">${positionSizeUSD.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Margem Usada ({alavancagem}x):</span>
            <span className="font-medium">${marginRequired.toFixed(2)}</span>
          </div>
          <div className="h-px w-full bg-glass-border my-1"></div>
          <div className="flex justify-between text-red">
            <span>Risco Financeiro:</span>
            <span className="font-bold">-${potentialLoss.toFixed(2)}</span>
          </div>
          {potentialProfit > 0 && (
            <div className="flex justify-between text-green">
              <span>Lucro Potencial:</span>
              <span className="font-bold">+${potentialProfit.toFixed(2)}</span>
            </div>
          )}
          {rrRatio > 0 && (
            <div className="flex justify-between text-accent">
              <span>Risco/Retorno:</span>
              <span className="font-bold">1 : {rrRatio.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

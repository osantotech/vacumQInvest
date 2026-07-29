'use client';

import React, { useState, useEffect } from 'react';
import './CalculadoraRisco.css';

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
  }, [currentPrice, entryPrice]);

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
    <div className="calc-container">
      <div className="calc-header">
        <h2 className="calc-title">
          <svg className="calc-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Calculadora SMC
        </h2>
      </div>

      {/* Capital e Risco */}
      <div className="calc-grid">
        <div>
          <label className="calc-label">Capital Total ($)</label>
          <input 
            type="number" 
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            className="calc-input"
          />
        </div>
        <div>
          <label className="calc-label">Risco (%)</label>
          <div className="calc-input-wrapper">
            <input 
              type="number" 
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              step="0.1"
              className="calc-input with-icon-right"
            />
            <span className="calc-input-icon-right">%</span>
          </div>
        </div>
      </div>

      {/* Tipo e Alavancagem */}
      <div className="calc-grid">
        <div>
          <label className="calc-label">Tipo</label>
          <div className="calc-btn-group">
            <button 
              onClick={() => setTipo('LONG')}
              className={`calc-btn ${tipo === 'LONG' ? 'active-long' : ''}`}
            >
              LONG
            </button>
            <button 
              onClick={() => setTipo('SHORT')}
              className={`calc-btn ${tipo === 'SHORT' ? 'active-short' : ''}`}
            >
              SHORT
            </button>
          </div>
        </div>
        <div>
          <label className="calc-label">Alavancagem</label>
          <div className="calc-input-wrapper">
            <input 
              type="number" 
              value={alavancagem}
              onChange={(e) => setAlavancagem(Number(e.target.value))}
              className="calc-input with-icon-right"
            />
            <span className="calc-input-icon-right">x</span>
          </div>
        </div>
      </div>

      <div className="calc-divider"></div>

      {/* Preços */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label className="calc-label">Preço de Entrada</label>
          <div className="calc-input-wrapper">
            <span className="calc-input-icon-left">$</span>
            <input 
              type="number" 
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value ? Number(e.target.value) : '')}
              className="calc-input with-icon-left"
              placeholder="Ex: 63400.50"
            />
          </div>
        </div>
        <div>
          <label className="calc-label">Stop Loss</label>
          <div className="calc-input-wrapper">
            <span className="calc-input-icon-left">$</span>
            <input 
              type="number" 
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value ? Number(e.target.value) : '')}
              className="calc-input with-icon-left danger"
              placeholder="Obrigatório"
            />
          </div>
        </div>
        <div>
          <label className="calc-label">Take Profit (Opcional)</label>
          <div className="calc-input-wrapper">
            <span className="calc-input-icon-left">$</span>
            <input 
              type="number" 
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value ? Number(e.target.value) : '')}
              className="calc-input with-icon-left success"
              placeholder="Opcional"
            />
          </div>
        </div>
      </div>

      {/* Resultados da Calculadora */}
      <div className="calc-results">
        <h3 className="calc-results-title">Tamanho da Posição</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
          <span className="calc-result-value accent">{positionSizeAsset > 0 ? positionSizeAsset.toFixed(4) : '0.00'}</span>
          <span className="calc-result-label">Contratos</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="calc-result-row">
            <span className="calc-result-label">Tamanho Total:</span>
            <span className="calc-result-value">${positionSizeUSD.toFixed(2)}</span>
          </div>
          <div className="calc-result-row">
            <span className="calc-result-label">Margem ({alavancagem}x):</span>
            <span className="calc-result-value">${marginRequired.toFixed(2)}</span>
          </div>
          <div className="calc-divider"></div>
          <div className="calc-result-row">
            <span className="calc-result-label">Risco:</span>
            <span className="calc-result-value red">-${potentialLoss.toFixed(2)}</span>
          </div>
          {potentialProfit > 0 && (
            <div className="calc-result-row">
              <span className="calc-result-label">Lucro Potencial:</span>
              <span className="calc-result-value green">+${potentialProfit.toFixed(2)}</span>
            </div>
          )}
          {rrRatio > 0 && (
            <div className="calc-result-row">
              <span className="calc-result-label">Risco/Retorno:</span>
              <span className="calc-result-value accent">1 : {rrRatio.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

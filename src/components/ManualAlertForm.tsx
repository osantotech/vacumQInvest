'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ManualAlertFormProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function ManualAlertForm({ onClose, onSaved }: ManualAlertFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [ativo, setAtivo] = useState('');
  const [timeframe, setTimeframe] = useState('30');
  const [indicador, setIndicador] = useState('Entrada e Saída v1.16');
  const [direcao, setDirecao] = useState('LONG');
  const [viaEntrada, setViaEntrada] = useState('');
  const [precoEntrada, setPrecoEntrada] = useState('');
  const [stop, setStop] = useState('');
  const [tp1, setTp1] = useState('');
  const [tp2, setTp2] = useState('');
  const [tp3, setTp3] = useState('');
  const [confiancaNota, setConfiancaNota] = useState('');
  
  const [mercado, setMercado] = useState('');
  const [veredito, setVeredito] = useState('');

  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.showModal();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ativo,
          timeframe,
          indicador,
          direcao,
          via_entrada: viaEntrada || undefined,
          preco_entrada: precoEntrada ? parseFloat(precoEntrada) : undefined,
          stop: stop ? parseFloat(stop) : undefined,
          tp1: tp1 ? parseFloat(tp1) : undefined,
          tp2: tp2 ? parseFloat(tp2) : undefined,
          tp3: tp3 ? parseFloat(tp3) : undefined,
          confianca_nota: confiancaNota || undefined,
          
          mercado_nota: mercado || undefined,
          veredito: veredito || undefined,
          secret: process.env.NEXT_PUBLIC_WEBHOOK_SECRET, // Mocking for manual if required, but api/alerts should not need it
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao criar sinal');
      }

      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog ref={dialogRef} onClose={onClose} className="bg-glass border-glass-border">
      <div className="dialog-header">
        <h2>Novo Sinal (Manual)</h2>
        <button className="btn-close" onClick={onClose} disabled={loading}>✕</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="dialog-body space-y-4">
          
          {error && <div className="text-red text-sm p-3 bg-red-bg rounded border border-red/20">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>Ativo</label>
              <input 
                type="text" 
                required 
                value={ativo}
                onChange={(e) => setAtivo(e.target.value.toUpperCase())}
                disabled={loading}
                placeholder="Ex: BTCUSDT"
              />
            </div>
            <div className="form-group">
              <label>Timeframe</label>
              <select 
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                disabled={loading}
              >
                <option value="1">1m</option>
                <option value="5">5m</option>
                <option value="15">15m</option>
                <option value="30">30m</option>
                <option value="60">1h</option>
                <option value="240">4h</option>
                <option value="D">1D</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Indicador</label>
              <select 
                value={indicador}
                onChange={(e) => setIndicador(e.target.value)}
                disabled={loading}
              >
                <option value="Entrada e Saída v1.16">Entrada e Saída v1.16</option>
                <option value="VacumQ Grécia v1.5">VacumQ Grécia v1.5</option>
              </select>
            </div>
            <div className="form-group">
              <label>Direção</label>
              <select 
                value={direcao}
                onChange={(e) => setDirecao(e.target.value)}
                disabled={loading}
              >
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
                <option value="SCALP_LONG">SCALP_LONG</option>
                <option value="SCALP_SHORT">SCALP_SHORT</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Preço Entrada</label>
              <input 
                type="number" 
                step="any"
                value={precoEntrada}
                onChange={(e) => setPrecoEntrada(e.target.value)}
                disabled={loading}
                className="font-mono"
              />
            </div>
            <div className="form-group">
              <label>Stop</label>
              <input 
                type="number" 
                step="any"
                value={stop}
                onChange={(e) => setStop(e.target.value)}
                disabled={loading}
                className="font-mono"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>TP1 (Opcional)</label>
              <input 
                type="number" 
                step="any"
                value={tp1}
                onChange={(e) => setTp1(e.target.value)}
                disabled={loading}
                className="font-mono"
              />
            </div>
            <div className="form-group">
              <label>TP2 (Opcional)</label>
              <input 
                type="number" 
                step="any"
                value={tp2}
                onChange={(e) => setTp2(e.target.value)}
                disabled={loading}
                className="font-mono"
              />
            </div>
            <div className="form-group">
              <label>TP3 (Opcional)</label>
              <input 
                type="number" 
                step="any"
                value={tp3}
                onChange={(e) => setTp3(e.target.value)}
                disabled={loading}
                className="font-mono"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Confiança (Opcional)</label>
              <select 
                value={confiancaNota}
                onChange={(e) => setConfiancaNota(e.target.value)}
                disabled={loading}
              >
                <option value="">—</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div className="form-group">
              <label>Mercado (Opcional)</label>
              <select 
                value={mercado}
                onChange={(e) => setMercado(e.target.value)}
                disabled={loading}
              >
                <option value="">—</option>
                <option value="FORTE">FORTE</option>
                <option value="OK">OK</option>
                <option value="FRACO">FRACO</option>
              </select>
            </div>
            <div className="form-group">
              <label>Via Entrada (Opcional)</label>
              <select 
                value={viaEntrada}
                onChange={(e) => setViaEntrada(e.target.value)}
                disabled={loading}
              >
                <option value="">—</option>
                <option value="FIBO">FIBO</option>
                <option value="FORÇA">FORÇA</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Veredito (Opcional)</label>
            <textarea 
              value={veredito}
              onChange={(e) => setVeredito(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

        </div>
        <div className="dialog-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Criar Sinal'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

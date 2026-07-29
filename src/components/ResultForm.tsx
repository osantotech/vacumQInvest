'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Alert } from '@/lib/types';

interface ResultFormProps {
  alertId: string | null;
  alert: Alert | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ResultForm({ alertId, alert, onClose, onSaved }: ResultFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [precoSaida, setPrecoSaida] = useState('');
  const [dataSaida, setDataSaida] = useState('');
  const [status, setStatus] = useState('TP1');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (alertId && alert && dialogRef.current) {
      // Setup initial values
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDataSaida(now.toISOString().slice(0, 16));
      setPrecoSaida('');
      setStatus('TP1');
      setObservacao('');
      setError(null);
      
      dialogRef.current.showModal();
    } else if (!alertId && dialogRef.current) {
      dialogRef.current.close();
    }
  }, [alertId, alert]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: alertId,
          preco_saida: parseFloat(precoSaida),
          data_saida: new Date(dataSaida).toISOString(),
          status,
          observacao: observacao || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar resultado');
      }

      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!alert) return null;

  return (
    <dialog ref={dialogRef} onClose={onClose} className="bg-glass border-glass-border">
      <div className="dialog-header">
        <h2>Registrar Resultado — {alert.ativo}</h2>
        <button className="btn-close" onClick={onClose} disabled={loading}>✕</button>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="dialog-body space-y-4">
          
          <div className="bg-bg-secondary p-3 rounded-radius-sm border border-border text-sm mb-4">
            <div className="flex gap-4">
              <div><span className="text-text-secondary mr-1">Direção:</span> {alert.direcao}</div>
              <div><span className="text-text-secondary mr-1">Entrada:</span> <span className="font-mono">{alert.preco_entrada || '—'}</span></div>
            </div>
          </div>

          {error && <div className="text-red text-sm p-3 bg-red-bg rounded border border-red/20">{error}</div>}

          <div className="form-group">
            <label>Preço de Saída</label>
            <input 
              type="number" 
              step="any" 
              required 
              value={precoSaida}
              onChange={(e) => setPrecoSaida(e.target.value)}
              disabled={loading}
              className="font-mono"
            />
          </div>

          <div className="form-group">
            <label>Data/Hora da Saída</label>
            <input 
              type="datetime-local" 
              required 
              value={dataSaida}
              onChange={(e) => setDataSaida(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select 
              required 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              <option value="TP1">TP1</option>
              <option value="TP2">TP2</option>
              <option value="TP3">TP3</option>
              <option value="STOP">STOP</option>
              <option value="MANUAL">MANUAL</option>
              <option value="3X">3X (Recuperação)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Observação (Opcional)</label>
            <textarea 
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              disabled={loading}
              placeholder="Ex: Saiu no TP2, mercado começou a lateralizar"
            />
          </div>

        </div>
        <div className="dialog-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Resultado'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

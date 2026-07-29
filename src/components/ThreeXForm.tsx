'use client';

import React, { useEffect, useRef, useState } from 'react';

interface ThreeXFormProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function ThreeXForm({ onClose, onSaved }: ThreeXFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [ativo, setAtivo] = useState('');
  const [dataOperacao, setDataOperacao] = useState('');
  const [entradaOriginal, setEntradaOriginal] = useState('');
  const [entrada3x, setEntrada3x] = useState('');
  const [saida, setSaida] = useState('');
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (dialogRef.current) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDataOperacao(now.toISOString().slice(0, 16));
      dialogRef.current.showModal();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/three-x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ativo,
          data_operacao: new Date(dataOperacao).toISOString(),
          entrada_original: parseFloat(entradaOriginal),
          entrada_3x: parseFloat(entrada3x),
          saida: parseFloat(saida),
          observacao: observacao || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao registrar operação 3X');
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
        <h2>Registrar Operação 3X</h2>
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
              <label>Data/Hora</label>
              <input 
                type="datetime-local" 
                required 
                value={dataOperacao}
                onChange={(e) => setDataOperacao(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Entrada Original</label>
              <input 
                type="number" 
                step="any" 
                required 
                value={entradaOriginal}
                onChange={(e) => setEntradaOriginal(e.target.value)}
                disabled={loading}
                className="font-mono"
              />
            </div>
            <div className="form-group">
              <label>Entrada 3X</label>
              <input 
                type="number" 
                step="any" 
                required 
                value={entrada3x}
                onChange={(e) => setEntrada3x(e.target.value)}
                disabled={loading}
                className="font-mono"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Preço de Saída</label>
            <input 
              type="number" 
              step="any" 
              required 
              value={saida}
              onChange={(e) => setSaida(e.target.value)}
              disabled={loading}
              className="font-mono"
            />
          </div>

          <div className="form-group">
            <label>Observação (Opcional)</label>
            <textarea 
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

        </div>
        <div className="dialog-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar 3X'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

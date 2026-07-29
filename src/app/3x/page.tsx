'use client';

import { useEffect, useState } from 'react';
import ThreeXForm from '@/components/ThreeXForm';
import { formatPrice, formatPct, formatDateTimeBR } from '@/lib/calculations';
import type { ThreeXOperation } from '@/lib/types';

export default function ThreeX() {
  const [operations, setOperations] = useState<ThreeXOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const fetchOperations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/three-x?page=${page}`);
      if (!res.ok) throw new Error('Falha ao carregar operações 3X');
      
      const data = await res.json();
      setOperations(data.operations);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const onSaved = () => {
    setShowForm(false);
    fetchOperations();
  };

  return (
    <div className="animate-in">
      <div className="page-header flex-between mb-6">
        <div>
          <h1>Operações 3X</h1>
          <p className="page-subtitle">Registro de operações de recuperação de banca</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Registrar 3X</button>
      </div>

      {error && <div className="text-red p-4 bg-red-bg rounded border border-red/20 mb-4">{error}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Ativo</th>
              <th>Entrada Original</th>
              <th>Entrada 3X</th>
              <th>Saída</th>
              <th>Resultado</th>
              <th>Spread 20x</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8}><div className="skeleton h-8 w-full rounded"></div></td>
                </tr>
              ))
            ) : operations.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-text-muted py-8">Nenhuma operação 3X registrada</td>
              </tr>
            ) : (
              operations.map(op => (
                <tr key={op.id} className={op.resultado_marg && op.resultado_marg > 0 ? 'bg-green-bg/30' : op.resultado_marg && op.resultado_marg < 0 ? 'bg-red-bg/30' : ''}>
                  <td>{formatDateTimeBR(op.data_operacao)}</td>
                  <td className="font-bold">{op.ativo}</td>
                  <td className="font-mono">{formatPrice(op.entrada_original)}</td>
                  <td className="font-mono text-accent">{formatPrice(op.entrada_3x)}</td>
                  <td className="font-mono">{formatPrice(op.saida)}</td>
                  <td className={`font-mono font-semibold ${op.resultado_pct && op.resultado_pct > 0 ? 'text-green' : 'text-red'}`}>
                    {op.resultado_pct !== null ? formatPct(op.resultado_pct) : '—'}
                  </td>
                  <td className={`font-mono font-bold ${op.resultado_marg && op.resultado_marg > 0 ? 'text-green' : 'text-red'}`}>
                    {op.resultado_marg !== null ? formatPct(op.resultado_marg) : '—'}
                  </td>
                  <td className="text-sm text-text-secondary max-w-[200px] truncate" title={op.observacao || undefined}>
                    {op.observacao || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex-between mt-4">
        <button 
          className="btn btn-secondary btn-sm" 
          disabled={page === 1 || loading}
          onClick={() => setPage(p => p - 1)}
        >
          Anterior
        </button>
        <span className="text-sm text-text-muted">Página {page} de {totalPages || 1}</span>
        <button 
          className="btn btn-secondary btn-sm" 
          disabled={page >= totalPages || loading}
          onClick={() => setPage(p => p + 1)}
        >
          Próxima
        </button>
      </div>

      {showForm && (
        <ThreeXForm onClose={() => setShowForm(false)} onSaved={onSaved} />
      )}
    </div>
  );
}

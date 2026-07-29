'use client';

import { useEffect, useState } from 'react';
import FilterBar from '@/components/FilterBar';
import StatusBadge from '@/components/StatusBadge';
import { formatPrice, formatPct, formatDateTimeBR, formatDuration } from '@/lib/calculations';
import type { ResultWithAlert } from '@/lib/types';

export default function Resultados() {
  const [results, setResults] = useState<ResultWithAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    indicador: '',
    ativo: ''
  });

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.append('page', page.toString());
      if (filters.indicador) query.append('indicador', filters.indicador);
      if (filters.ativo) query.append('ativo', filters.ativo);

      const res = await fetch(`/api/results?${query.toString()}`);
      if (!res.ok) throw new Error('Falha ao carregar resultados');
      
      const data = await res.json();
      setResults(data.results);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const totalPnl = results.reduce((sum, r) => sum + (r.resultado_marg || 0), 0);
  const winRate = results.length > 0 ? (results.filter(r => r.status !== 'STOP').length / results.length) * 100 : 0;
  const avgDuration = results.length > 0 ? results.reduce((sum, r) => sum + (r.duracao_minutos || 0), 0) / results.length : 0;

  return (
    <div className="animate-in">
      <div className="page-header mb-6">
        <h1>Resultados</h1>
        <p className="page-subtitle">Histórico de operações fechadas</p>
      </div>

      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {error && <div className="text-red p-4 bg-red-bg rounded border border-red/20 mb-4">{error}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data Alerta</th>
              <th>Data Saída</th>
              <th>Ativo</th>
              <th>Indicador</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th>% Resultado</th>
              <th>Spread 20x</th>
              <th>Duração</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={10}><div className="skeleton h-8 w-full rounded"></div></td>
                </tr>
              ))
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center text-text-muted py-8">Nenhum resultado encontrado</td>
              </tr>
            ) : (
              results.map(result => (
                <tr key={result.id} className={result.resultado_marg && result.resultado_marg > 0 ? 'bg-green-bg/30' : result.resultado_marg && result.resultado_marg < 0 ? 'bg-red-bg/30' : ''}>
                  <td>{formatDateTimeBR(result.alerts.created_at)}</td>
                  <td>{formatDateTimeBR(result.data_saida)}</td>
                  <td className="font-bold">{result.alerts.ativo}</td>
                  <td className="text-xs">{result.alerts.indicador}</td>
                  <td className="font-mono">{formatPrice(result.alerts.preco_entrada)}</td>
                  <td className="font-mono">{formatPrice(result.preco_saida)}</td>
                  <td className={`font-mono font-semibold ${result.resultado_pct && result.resultado_pct > 0 ? 'text-green' : 'text-red'}`}>
                    {result.resultado_pct !== null ? formatPct(result.resultado_pct) : '—'}
                  </td>
                  <td className={`font-mono font-bold ${result.resultado_marg && result.resultado_marg > 0 ? 'text-green' : 'text-red'}`}>
                    {result.resultado_marg !== null ? formatPct(result.resultado_marg) : '—'}
                  </td>
                  <td>{result.duracao_minutos ? formatDuration(result.duracao_minutos) : '—'}</td>
                  <td><StatusBadge type="status" value={result.status} /></td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="table-footer bg-bg-secondary font-bold text-white">
            <tr>
              <td colSpan={6} className="text-right">Total na página:</td>
              <td>Win Rate: {winRate.toFixed(1)}%</td>
              <td className={totalPnl > 0 ? 'text-green' : 'text-red'}>{totalPnl > 0 ? '+' : ''}{totalPnl.toFixed(1)}%</td>
              <td>Média: {formatDuration(avgDuration)}</td>
              <td></td>
            </tr>
          </tfoot>
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
    </div>
  );
}

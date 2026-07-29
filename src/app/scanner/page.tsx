'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import { formatPrice, formatDateTimeBR } from '@/lib/calculations';

type ScannerSignal = {
  id: string;
  created_at: string;
  ativo: string;
  timeframe: string;
  fase: string;
  direcao: 'LONG' | 'SHORT';
  brk_price: number;
  close_atual: number;
  score_pbv: number;
  fatores: {
    vol_5x: boolean;
    vol_caindo: boolean;
    zona_fibo: boolean;
    toque_sma: boolean;
    candle_forte: boolean;
  };
};

export default function Scanner() {
  const [signals, setSignals] = useState<ScannerSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState({
    ativo: '',
    fase: '',
    direcao: '',
    timeframe: ''
  });

  const fetchSignals = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.append('page', page.toString());
      if (filters.ativo) query.append('ativo', filters.ativo.toUpperCase());
      if (filters.fase) query.append('fase', filters.fase);
      if (filters.direcao) query.append('direcao', filters.direcao);
      if (filters.timeframe) query.append('timeframe', filters.timeframe);

      const res = await fetch(`/api/scanner/history?${query.toString()}`);
      if (!res.ok) throw new Error('Falha ao carregar sinais do scanner');
      
      const data = await res.json();
      setSignals(data.signals);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 60000); // refresh 1 min
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const scoreColor = (score: number) => {
    if (score >= 4) return 'text-green';
    if (score === 3) return 'text-yellow';
    return 'text-red';
  };

  const booleanIcon = (val: boolean) => val ? '✅' : '⬜';

  return (
    <div className="animate-in">
      <div className="page-header flex-between mb-6">
        <div>
          <h1 className="flex items-center gap-2">
            ⚡ VQ Scanner
            <span className="text-sm font-normal text-text-muted bg-green/10 text-green px-2 py-1 rounded-full animate-pulse border border-green/20">
              Ao Vivo
            </span>
          </h1>
          <p className="page-subtitle">Rastreamento autônomo de Pullbacks em 50 criptos futuros USDT</p>
        </div>
      </div>

      <div className="filter-bar flex flex-wrap gap-4 mb-6">
        <div className="form-group mb-0">
          <input 
            type="text" 
            placeholder="Buscar Ativo..." 
            value={filters.ativo}
            onChange={(e) => handleFilterChange('ativo', e.target.value)}
          />
        </div>
        <div className="form-group mb-0">
          <select value={filters.direcao} onChange={(e) => handleFilterChange('direcao', e.target.value)}>
            <option value="">Todas as Direções</option>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </div>
        <div className="form-group mb-0">
          <select value={filters.timeframe} onChange={(e) => handleFilterChange('timeframe', e.target.value)}>
            <option value="">Todos TFs</option>
            <option value="15m">15m</option>
            <option value="30m">30m</option>
            <option value="2h">2h</option>
            <option value="4h">4h</option>
          </select>
        </div>
        <div className="form-group mb-0">
          <select value={filters.fase} onChange={(e) => handleFilterChange('fase', e.target.value)}>
            <option value="">Todas as Fases</option>
            <option value="PST_FLIP">PST Flip</option>
            <option value="PB_START">Início Pullback</option>
            <option value="PBv">PBv (Placar)</option>
            <option value="PPB_EC">PPB-ec (Confirmado)</option>
          </select>
        </div>
      </div>

      {error && <div className="text-red p-4 bg-red-bg rounded border border-red/20 mb-4">{error}</div>}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Ativo</th>
              <th>TF</th>
              <th>Fase</th>
              <th>Direção</th>
              <th>Brk Price</th>
              <th>Fechamento</th>
              <th>Score PBv</th>
              <th>Fatores (Vol 5x | Vol ▼ | Fibo | SMA | Força)</th>
            </tr>
          </thead>
          <tbody>
            {loading && signals.length === 0 ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9}><div className="skeleton h-8 w-full rounded"></div></td>
                </tr>
              ))
            ) : signals.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-text-muted py-8">Nenhum sinal detectado com os filtros atuais</td>
              </tr>
            ) : (
              signals.map(sig => (
                <tr key={sig.id} className="hover:bg-bg-card-hover">
                  <td className="text-sm">{formatDateTimeBR(sig.created_at)}</td>
                  <td className="font-bold text-lg">{sig.ativo}</td>
                  <td><span className="bg-bg-input px-2 py-1 rounded text-text-muted">{sig.timeframe}</span></td>
                  <td>
                    {sig.fase === 'PPB_EC' ? <span className="badge badge-long">PPB-ec Confirmado</span> :
                     sig.fase === 'PBv'    ? <span className="badge badge-open">PBv Analisado</span> :
                     sig.fase === 'PB_START'? <span className="badge badge-scalp">Iniciou Pullback</span> :
                     <span className="badge badge-stop">PST Flip</span>}
                  </td>
                  <td><StatusBadge type="direction" value={sig.direcao} /></td>
                  <td className="font-mono text-text-muted">{formatPrice(sig.brk_price)}</td>
                  <td className="font-mono">{formatPrice(sig.close_atual)}</td>
                  <td className={`font-bold ${scoreColor(sig.score_pbv)}`}>{sig.score_pbv}/5</td>
                  <td className="font-mono text-sm tracking-widest text-text-secondary">
                    {booleanIcon(sig.fatores?.vol_5x)}
                    {' '}
                    {booleanIcon(sig.fatores?.vol_caindo)}
                    {' '}
                    {booleanIcon(sig.fatores?.zona_fibo)}
                    {' '}
                    {booleanIcon(sig.fatores?.toque_sma)}
                    {' '}
                    {booleanIcon(sig.fatores?.candle_forte)}
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
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatDuration } from '@/lib/calculations';
import './resultados.css';

// ============================================================
// Types
// ============================================================
interface AlertData {
  id: string;
  created_at: string;
  ativo: string;
  timeframe: string;
  indicador: string;
  direcao: string;
  preco_entrada: number;
}

interface ResultRow {
  id: string;
  preco_saida: number;
  data_saida: string;
  duracao_minutos: number | null;
  status: string;
  alert: AlertData;
}

// ============================================================
// Helpers
// ============================================================
function formatDateTimeBR(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatPriceSmart(value: number): string {
  return Number(value).toString();
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCapitalHeader(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function isLongDir(dir: string): boolean {
  return dir === 'LONG' || dir === 'SCALP_LONG';
}

// ============================================================
// Component
// ============================================================
export default function Resultados() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive controls
  const [leverage, setLeverage] = useState(20);
  const [capital1, setCapital1] = useState(1000);
  const [capital2, setCapital2] = useState(10000);

  // Filters
  const [filterDir, setFilterDir] = useState('');
  const [filterAtivo, setFilterAtivo] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch data via API endpoint
  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/results?limit=500');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || 'Falha ao carregar resultados');
      }
      
      const json = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows: ResultRow[] = (json.data || []).map((r: any) => ({
        id: r.id,
        preco_saida: Number(r.preco_saida),
        data_saida: r.data_saida,
        duracao_minutos: r.duracao_minutos,
        status: r.status,
        alert: r.alerts || r.alert,
      })).filter((r: ResultRow) => r.alert);

      setResults(rows);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Copy to clipboard
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  // Unique ativos for filter dropdown
  const uniqueAtivos = Array.from(new Set(results.map(r => r.alert.ativo))).sort();

  // Apply filters (frontend-only)
  const filtered = results.filter(r => {
    if (filterDir && !r.alert.direcao.includes(filterDir)) return false;
    if (filterAtivo && r.alert.ativo !== filterAtivo) return false;
    if (filterDateStart) {
      const start = new Date(filterDateStart);
      if (new Date(r.alert.created_at) < start) return false;
    }
    if (filterDateEnd) {
      const end = new Date(filterDateEnd + 'T23:59:59');
      if (new Date(r.alert.created_at) > end) return false;
    }
    return true;
  });

  // Compute derived values for each row
  const computedRows = filtered.map(r => {
    const entry = Number(r.alert.preco_entrada);
    const exit = Number(r.preco_saida);
    const long = isLongDir(r.alert.direcao);

    const pctResult = entry > 0
      ? (long
          ? ((exit - entry) / entry) * 100
          : ((entry - exit) / entry) * 100)
      : 0;

    const spreadLev = pctResult * leverage;
    const res1 = capital1 * (1 + (pctResult / 100) * leverage);
    const res2 = capital2 * (1 + (pctResult / 100) * leverage);
    const dur = r.duracao_minutos ?? 0;

    return { ...r, pctResult, spreadLev, res1, res2, dur };
  });

  // Summary stats
  const totalOps = computedRows.length;
  const wins = computedRows.filter(r => r.pctResult > 0).length;
  const stops = computedRows.filter(r => r.pctResult <= 0).length;
  const winRate = totalOps > 0 ? (wins / totalOps) * 100 : 0;
  const totalSpread = computedRows.reduce((sum, r) => sum + r.spreadLev, 0);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* Page Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#D1D4DC', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
          RESULTADOS DE ALERTAS
        </h1>
        <p style={{ fontSize: '13px', color: '#787B86', marginTop: '4px' }}>
          {totalOps} operações · WR {winRate.toFixed(1)}%
        </p>
      </div>

      {/* Controls Bar */}
      <div className="ra-controls">
        {/* Leverage */}
        <div className="ra-control-group">
          <span className="ra-control-label">Alavancagem</span>
          <div className="ra-leverage-btns">
            {[20, 50, 100, 150].map(lev => (
              <button
                key={lev}
                className={`ra-lev-btn ${leverage === lev ? 'active' : ''}`}
                onClick={() => setLeverage(lev)}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        {/* Capital 1 */}
        <div className="ra-control-group">
          <span className="ra-control-label">Capital 1 ($)</span>
          <input
            type="number"
            className="ra-capital-input"
            value={capital1}
            onChange={(e) => setCapital1(Number(e.target.value) || 0)}
          />
        </div>

        {/* Capital 2 */}
        <div className="ra-control-group">
          <span className="ra-control-label">Capital 2 ($)</span>
          <input
            type="number"
            className="ra-capital-input"
            value={capital2}
            onChange={(e) => setCapital2(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="ra-filters">
        <select className="ra-filter-select" value={filterDir} onChange={e => setFilterDir(e.target.value)}>
          <option value="">Todas Direções</option>
          <option value="LONG">LONG</option>
          <option value="SHORT">SHORT</option>
        </select>

        <select className="ra-filter-select" value={filterAtivo} onChange={e => setFilterAtivo(e.target.value)}>
          <option value="">Todos Ativos</option>
          {uniqueAtivos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <input
          type="date"
          className="ra-filter-date"
          value={filterDateStart}
          onChange={e => setFilterDateStart(e.target.value)}
          placeholder="Data Início"
        />
        <input
          type="date"
          className="ra-filter-date"
          value={filterDateEnd}
          onChange={e => setFilterDateEnd(e.target.value)}
          placeholder="Data Fim"
        />

        {(filterDir || filterAtivo || filterDateStart || filterDateEnd) && (
          <button
            onClick={() => { setFilterDir(''); setFilterAtivo(''); setFilterDateStart(''); setFilterDateEnd(''); }}
            style={{ padding: '6px 12px', fontSize: '11px', background: 'transparent', border: '1px solid #2A2E39', borderRadius: '6px', color: '#FF5252', cursor: 'pointer' }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="ra-stats">
        <div className="ra-stat-card">
          <div className="ra-stat-label">Total Operações</div>
          <div className="ra-stat-value">{totalOps}</div>
        </div>
        <div className="ra-stat-card">
          <div className="ra-stat-label">Win Rate</div>
          <div className={`ra-stat-value ${winRate >= 50 ? 'green' : 'red'}`}>{winRate.toFixed(1)}%</div>
        </div>
        <div className="ra-stat-card">
          <div className="ra-stat-label">Ganhos / Stops</div>
          <div className="ra-stat-value">
            <span style={{ color: '#00E676' }}>{wins}</span>
            <span style={{ color: '#787B86' }}> / </span>
            <span style={{ color: '#FF5252' }}>{stops}</span>
          </div>
        </div>
        <div className="ra-stat-card">
          <div className="ra-stat-label">P&L Acum. ({leverage}x)</div>
          <div className={`ra-stat-value ${totalSpread >= 0 ? 'green' : 'red'}`}>
            {totalSpread >= 0 ? '+' : ''}{formatBRL(totalSpread)}%
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.3)', borderRadius: '8px', color: '#FF5252', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="ra-table-wrap">
        <table className="ra-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}></th>
              <th>Data Alerta</th>
              <th>Nome do Ativo USDT</th>
              <th>Preço Alerta</th>
              <th>Data Resultado</th>
              <th>Preço Resultado</th>
              <th>% Resultado</th>
              <th>Spread {leverage}x</th>
              <th>Tempo</th>
              <th className="ra-hide-mobile">Resultado {formatCapitalHeader(capital1)}</th>
              <th className="ra-hide-mobile">Resultado {formatCapitalHeader(capital2)}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={11}><div className="ra-skeleton"></div></td>
                </tr>
              ))
            ) : computedRows.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', color: '#787B86', padding: '40px 0', fontSize: '14px' }}>
                  Nenhum resultado encontrado
                </td>
              </tr>
            ) : (
              computedRows.map(row => {
                const long = isLongDir(row.alert.direcao);
                return (
                  <tr key={row.id}>
                    {/* Col 1: Direction */}
                    <td>
                      <div className="ra-dir">
                        <span className={`ra-dir-dot ${long ? 'long' : 'short'}`}></span>
                        <span className={`ra-dir-arrow ${long ? 'long' : 'short'}`}>
                          {long ? '↑' : '↓'}
                        </span>
                      </div>
                    </td>

                    {/* Col 2: Data Alerta */}
                    <td style={{ fontSize: '12px', color: '#787B86' }}>
                      {formatDateTimeBR(row.alert.created_at)}
                    </td>

                    {/* Col 3: Nome do Ativo */}
                    <td>
                      <div className="ra-ativo">
                        <span className="ra-ativo-name">{row.alert.ativo}</span>
                        <button
                          className={`ra-copy-btn ${copiedId === row.id ? 'copied' : ''}`}
                          onClick={() => handleCopy(row.alert.ativo, row.id)}
                          title="Copiar ticker"
                        >
                          {copiedId === row.id ? '✓' : '📋'}
                        </button>
                      </div>
                    </td>

                    {/* Col 4: Preço Alerta */}
                    <td className="ra-price">
                      {formatPriceSmart(row.alert.preco_entrada)}
                    </td>

                    {/* Col 5: Data Resultado */}
                    <td style={{ fontSize: '12px', color: '#787B86' }}>
                      {formatDateTimeBR(row.data_saida)}
                    </td>

                    {/* Col 6: Preço Resultado */}
                    <td className="ra-price">
                      {formatPriceSmart(row.preco_saida)}
                    </td>

                    {/* Col 7: % Resultado */}
                    <td className="ra-price">
                      {formatBRL(row.pctResult)}%
                    </td>

                    {/* Col 8: Spread Nx */}
                    <td className={`ra-bold ${row.spreadLev >= 0 ? 'ra-green' : 'ra-red'}`}>
                      {formatBRL(row.spreadLev)}%
                    </td>

                    {/* Col 9: Tempo */}
                    <td style={{ color: '#787B86' }}>
                      {row.dur > 0 ? formatDuration(row.dur) : '—'}
                    </td>

                    {/* Col 10: Resultado Capital 1 */}
                    <td className={`ra-bold ra-hide-mobile ${row.res1 >= capital1 ? 'ra-green' : 'ra-red'}`}>
                      ${formatBRL(row.res1)}
                    </td>

                    {/* Col 11: Resultado Capital 2 */}
                    <td className={`ra-bold ra-hide-mobile ${row.res2 >= capital2 ? 'ra-green' : 'ra-red'}`}>
                      ${formatBRL(row.res2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {computedRows.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={7} style={{ textAlign: 'right' }}>
                  Totais:
                </td>
                <td className={totalSpread >= 0 ? 'ra-green' : 'ra-red'} style={{ fontWeight: 800 }}>
                  {totalSpread >= 0 ? '+' : ''}{formatBRL(totalSpread)}%
                </td>
                <td></td>
                <td className={`ra-hide-mobile ${computedRows.reduce((s, r) => s + r.res1, 0) >= capital1 * totalOps ? 'ra-green' : 'ra-red'}`} style={{ fontWeight: 800 }}>
                  ${formatBRL(computedRows.reduce((s, r) => s + (r.res1 - capital1), 0))}
                </td>
                <td className={`ra-hide-mobile ${computedRows.reduce((s, r) => s + r.res2, 0) >= capital2 * totalOps ? 'ra-green' : 'ra-red'}`} style={{ fontWeight: 800 }}>
                  ${formatBRL(computedRows.reduce((s, r) => s + (r.res2 - capital2), 0))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { calculateResultMargAt } from '@/lib/calculations';
import './rank.css';

// ============================================================
// Types
// ============================================================
interface RankRow {
  ativo: string;
  ops: number;
  wins: number;
  winRate: number;
  pctAcum: number;
  pctMedio: number;
  melhor: number;
  pior: number;
  margAcum: number;
}

// ============================================================
// Helpers
// ============================================================
function formatBRL(value: number, casas = 2): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function comSinal(value: number, casas = 2): string {
  return `${value >= 0 ? '+' : ''}${formatBRL(value, casas)}`;
}

function isLongDir(dir: string): boolean {
  return dir === 'LONG' || dir === 'SCALP_LONG';
}

// ============================================================
// Component
// ============================================================
export default function Rank() {
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [leverage, setLeverage] = useState(20);
  // Um ativo com uma única operação vencedora lidera o ranking por sorte, não
  // por consistência. Este filtro é o que separa uma coisa da outra.
  const [minOps, setMinOps] = useState(1);

  const fetchRank = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/results?limit=500');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || 'Falha ao carregar resultados');
      }

      const json = await res.json();
      const porAtivo = new Map<string, number[]>();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const r of (json.data || []) as any[]) {
        const alert = r.alerts || r.alert;
        if (!alert) continue;

        const entrada = Number(alert.preco_entrada);
        const saida = Number(r.preco_saida);

        const pct = r.resultado_pct !== null && r.resultado_pct !== undefined
          ? Number(r.resultado_pct)
          : entrada > 0
            ? (isLongDir(alert.direcao)
                ? ((saida - entrada) / entrada) * 100
                : ((entrada - saida) / entrada) * 100)
            : 0;

        if (!Number.isFinite(pct)) continue;

        const lista = porAtivo.get(alert.ativo) ?? [];
        lista.push(pct);
        porAtivo.set(alert.ativo, lista);
      }

      const agregado: RankRow[] = Array.from(porAtivo.entries()).map(([ativo, pcts]) => {
        const ops = pcts.length;
        const wins = pcts.filter(p => p > 0).length;
        const pctAcum = pcts.reduce((s, p) => s + p, 0);

        return {
          ativo,
          ops,
          wins,
          winRate: (wins / ops) * 100,
          pctAcum,
          pctMedio: pctAcum / ops,
          melhor: Math.max(...pcts),
          pior: Math.min(...pcts),
          // Soma o resultado alavancado operação a operação, cada uma com seu
          // teto de -100%. Alavancar a soma daria um número maior e falso: as
          // liquidações individuais desapareceriam na média.
          margAcum: pcts.reduce((s, p) => s + calculateResultMargAt(p, leverage), 0),
        };
      });

      setRows(agregado);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [leverage]);

  useEffect(() => {
    fetchRank();
  }, [fetchRank]);

  const ranked = rows
    .filter(r => r.ops >= minOps)
    .sort((a, b) => b.pctAcum - a.pctAcum);

  const totalAtivos = ranked.length;
  const melhorAtivo = ranked[0];

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '16px' }}>
        <h1 className="rk-title">RANK DE ATIVOS</h1>
      </div>

      {/* Controles */}
      <div className="rk-controls">
        <div className="rk-control-group">
          <span className="rk-control-label">Alavancagem</span>
          <div className="rk-btns">
            {[20, 50, 100, 150].map(lev => (
              <button
                key={lev}
                className={`rk-btn ${leverage === lev ? 'active' : ''}`}
                onClick={() => setLeverage(lev)}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        <div className="rk-control-group">
          <span className="rk-control-label">Mínimo de operações</span>
          <div className="rk-btns">
            {[1, 3, 5, 10].map(n => (
              <button
                key={n}
                className={`rk-btn ${minOps === n ? 'active' : ''}`}
                onClick={() => setMinOps(n)}
              >
                {n === 1 ? 'Todas' : `${n}+`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="rk-stats">
        <div className="rk-stat-card">
          <div className="rk-stat-label">Ativos no ranking</div>
          <div className="rk-stat-value">{totalAtivos}</div>
        </div>
        <div className="rk-stat-card">
          <div className="rk-stat-label">Melhor ativo</div>
          <div className="rk-stat-value">{melhorAtivo?.ativo ?? '—'}</div>
        </div>
        <div className="rk-stat-card">
          <div className="rk-stat-label">Ganho acumulado do líder</div>
          <div className={`rk-stat-value ${(melhorAtivo?.pctAcum ?? 0) >= 0 ? 'green' : 'red'}`}>
            {melhorAtivo ? `${comSinal(melhorAtivo.pctAcum)}%` : '—'}
          </div>
        </div>
      </div>

      {error && <div className="rk-error">{error}</div>}

      {/* Tabela */}
      <div className="rk-table-wrap">
        <table className="rk-table">
          <thead>
            <tr>
              <th style={{ width: '46px' }}>#</th>
              <th>Ativo</th>
              <th>Ops</th>
              <th>Win Rate</th>
              <th>% Acum.</th>
              <th>% Médio</th>
              <th>Melhor</th>
              <th>Pior</th>
              <th>Margem {leverage}x</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(6).fill(0).map((_, i) => (
                <tr key={i}><td colSpan={9}><div className="rk-skeleton" /></td></tr>
              ))
            ) : ranked.length === 0 ? (
              <tr>
                <td colSpan={9} className="rk-empty">
                  {rows.length === 0
                    ? 'Nenhum resultado registrado ainda'
                    : `Nenhum ativo com ${minOps} operações ou mais`}
                </td>
              </tr>
            ) : (
              ranked.map((r, i) => (
                <tr key={r.ativo}>
                  <td className={`rk-pos ${i < 3 ? `rk-pos-${i + 1}` : ''}`}>{i + 1}</td>
                  <td className="rk-ativo">{r.ativo}</td>
                  <td>{r.ops}</td>
                  <td className={r.winRate >= 50 ? 'rk-green' : 'rk-yellow'}>
                    {formatBRL(r.winRate, 1)}%
                  </td>
                  <td className={`rk-bold ${r.pctAcum >= 0 ? 'rk-green' : 'rk-red'}`}>
                    {comSinal(r.pctAcum)}%
                  </td>
                  <td className={r.pctMedio >= 0 ? 'rk-green' : 'rk-red'}>
                    {comSinal(r.pctMedio)}%
                  </td>
                  <td className="rk-green">{comSinal(r.melhor)}%</td>
                  <td className={r.pior >= 0 ? 'rk-green' : 'rk-red'}>{comSinal(r.pior)}%</td>
                  <td className={`rk-bold ${r.margAcum >= 0 ? 'rk-green' : 'rk-red'}`}>
                    {comSinal(r.margAcum)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="rk-nota">
        Ordenado por ganho percentual acumulado. A coluna Ops mostra em quantas
        operações o número se apoia — um ativo com uma só operação lidera por
        sorte, não por consistência.
      </p>
    </div>
  );
}

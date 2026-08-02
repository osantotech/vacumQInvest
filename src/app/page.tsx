'use client';

import { useEffect, useState } from 'react';
import StatsCard from '@/components/StatsCard';
import EquityCurve, { type EquityPoint } from '@/components/EquityCurve';
import StatusBadge from '@/components/StatusBadge';
import { calculateResultMarg, formatDateTimeBR } from '@/lib/calculations';
import type { DashboardStats, AlertWithResult } from '@/lib/types';

/**
 * Transforma a lista de resultados na série acumulada da curva de capital.
 *
 * A API devolve do mais recente para o mais antigo; a curva precisa do inverso,
 * senão o gráfico conta a história de trás para frente.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function montarCurva(rows: any[]): EquityPoint[] {
  const cronologico = [...rows].sort(
    (a, b) => new Date(a.data_saida).getTime() - new Date(b.data_saida).getTime()
  );

  let acumulado = 0;
  return cronologico.map(r => {
    const pct = Number(r.resultado_pct ?? 0);
    // Cada operação entra com seu próprio teto de -100%: alavancar a soma no
    // fim esconderia as liquidações individuais dentro da média.
    acumulado += calculateResultMarg(Number.isFinite(pct) ? pct : 0);
    return {
      label: new Date(r.data_saida).toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
      }),
      value: acumulado,
    };
  });
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AlertWithResult[]>([]);
  const [curva, setCurva] = useState<EquityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, alertsRes, resultsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/alerts?limit=5'),
          fetch('/api/results?limit=500'),
        ]);

        if (!statsRes.ok || !alertsRes.ok) {
          throw new Error('Erro ao buscar dados do dashboard');
        }

        const statsData = await statsRes.json();
        const alertsData = await alertsRes.json();

        setStats(statsData);
        setRecentAlerts(alertsData.data || []);

        // A curva é secundária: se ela falhar, o dashboard ainda serve.
        if (resultsRes.ok) {
          const resultsData = await resultsRes.json();
          setCurva(montarCurva(resultsData.data || []));
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="animate-in p-8">
        <div className="card p-6 border-red text-red">
          <h2 className="text-lg font-semibold mb-2">Erro</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Resumo geral das operações</p>
        </div>
        <div className="flex items-center gap-2 bg-glass p-2 px-4 rounded-full border border-glass-border">
          {loading ? (
            <div className="w-2 h-2 rounded-full bg-text-muted"></div>
          ) : (
            <div className={`w-3 h-3 rounded-full ${stats && stats.alertas_hoje > 0 ? 'bg-green shadow-[0_0_8px_rgba(38,166,154,0.6)] animate-pulse' : 'bg-red'}`}></div>
          )}
          <span className="text-sm font-medium">
            {loading ? 'Carregando...' : (stats && stats.alertas_hoje > 0 ? 'Mercado monitorado' : 'Sem sinais hoje')}
          </span>
        </div>
      </div>

      <div className="grid-stats">
        <StatsCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
          label="Total de Sinais" 
          value={loading ? '...' : (stats?.total_alertas || 0)} 
          color="accent" 
        />
        <StatsCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.675v.192c0 .98-1.405 1.625-2.922 1.625h-3.156c-1.517 0-2.922-.645-2.922-1.625v-.192c0-.528.243-1.01.652-1.312l3.424-2.52c.28-.206.666-.206.945 0l3.424 2.52c.41.302.652.784.652 1.312zM12 11.25a3.375 3.375 0 100-6.75 3.375 3.375 0 000 6.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.125c0-.98 1.405-1.625 2.922-1.625h.192c1.517 0 2.922.645 2.922 1.625v1.205c0 .528-.243 1.01-.652 1.312l-1.92 1.413c-.28.206-.666.206-.945 0l-1.92-1.413c-.41-.302-.652-.784-.652-1.312V7.125zM17.25 7.125c0-.98-1.405-1.625-2.922-1.625h-.192c-1.517 0-2.922.645-2.922 1.625v1.205c0 .528.243 1.01.652 1.312l1.92 1.413c.28.206.666.206.945 0l1.92-1.413c.41-.302.652-.784.652-1.312V7.125z" /></svg>}
          label="Win Rate" 
          value={loading ? '...' : `${stats?.win_rate?.toFixed(1) || 0}%`} 
          color="green" 
        />
        <StatsCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>}
          label="P&L Margem (20x)" 
          value={loading ? '...' : `${stats?.pnl_total_marg && stats.pnl_total_marg > 0 ? '+' : ''}${(stats?.pnl_total_marg || 0).toFixed(1)}%`} 
          color={stats?.pnl_total_marg && stats.pnl_total_marg < 0 ? 'red' : 'green'} 
        />
        <StatsCard 
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>}
          label="Melhor Ativo" 
          value={loading ? '...' : (stats?.melhor_ativo || '—')} 
          color="yellow" 
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' }}>
            <h2>Curva de Capital</h2>
            {!loading && curva.length > 0 && (
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  color: curva[curva.length - 1].value >= 0 ? '#00E676' : '#FF5252',
                }}
              >
                {curva[curva.length - 1].value >= 0 ? '+' : ''}
                {curva[curva.length - 1].value.toLocaleString('pt-BR', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}%
              </span>
            )}
          </div>
          <div className="card-body">
            {loading ? (
              <div className="skeleton w-full rounded" style={{ height: '260px' }}></div>
            ) : (
              <EquityCurve points={curva} />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Últimos Sinais</h2>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-8 w-full rounded"></div>)}
              </div>
            ) : (
              <div className="table-container border-0 rounded-none bg-transparent">
                <table className="mb-0">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Ativo</th>
                      <th>Direção</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAlerts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-text-muted py-8">Nenhum sinal encontrado</td>
                      </tr>
                    ) : (
                      recentAlerts.map(alert => (
                        <tr key={alert.id}>
                          <td>{formatDateTimeBR(alert.created_at)}</td>
                          <td className="font-bold">{alert.ativo}</td>
                          <td><StatusBadge type="direction" value={alert.direcao} /></td>
                          <td>
                            <StatusBadge 
                              type="status" 
                              value={alert.result ? alert.result.status : 'Aberto'} 
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

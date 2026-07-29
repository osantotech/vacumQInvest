export const dynamic = 'force-dynamic';
// ============================================================
// VacumQInvest — Stats API Route
// ============================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DashboardStats } from '@/lib/types';

// ------------------------------------------------------------------
// GET — Dashboard statistics
// ------------------------------------------------------------------
export async function GET() {
  try {
    const supabase = createClient();

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 1. Total alerts
    const { count: totalAlertas } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true });

    // 2. All results
    const { data: allResults } = await supabase
      .from('results')
      .select('status, resultado_marg');

    const results = allResults ?? [];
    const comResultado = results.length;
    const ganhos = results.filter((r) => r.status !== 'STOP').length;
    const stops = results.filter((r) => r.status === 'STOP').length;
    const winRate = comResultado > 0 ? (ganhos / comResultado) * 100 : 0;
    const pnlTotalMarg = results.reduce(
      (sum, r) => sum + (r.resultado_marg ?? 0),
      0
    );

    // 3. 3X count
    const tresXCount = results.filter((r) => r.status === '3X').length;

    // 4. Best asset by total resultado_marg
    const { data: resultsWithAlerts } = await supabase
      .from('results')
      .select('resultado_marg, alerts!inner(ativo)');

    let melhorAtivo = '—';
    if (resultsWithAlerts && resultsWithAlerts.length > 0) {
      const ativoMap = new Map<string, number>();
      for (const r of resultsWithAlerts) {
        const ativo = (r.alerts as unknown as { ativo: string }).ativo;
        const current = ativoMap.get(ativo) ?? 0;
        ativoMap.set(ativo, current + (r.resultado_marg ?? 0));
      }

      let maxMarg = -Infinity;
      for (const [ativo, marg] of Array.from(ativoMap.entries())) {
        if (marg > maxMarg) {
          maxMarg = marg;
          melhorAtivo = ativo;
        }
      }
    }

    // 5. Alerts today (São Paulo timezone)
    const now = new Date();
    const spFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todaySP = spFormatter.format(now); // yyyy-mm-dd format
    const todayStart = `${todaySP}T00:00:00-03:00`;
    const todayEnd = `${todaySP}T23:59:59-03:00`;

    const { count: alertasHoje } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);

    const stats: DashboardStats = {
      total_alertas: totalAlertas ?? 0,
      com_resultado: comResultado,
      ganhos,
      stops,
      win_rate: Math.round(winRate * 10) / 10,
      pnl_total_marg: Math.round(pnlTotalMarg * 10) / 10,
      melhor_ativo: melhorAtivo,
      alertas_hoje: alertasHoje ?? 0,
      tres_x_count: tresXCount,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

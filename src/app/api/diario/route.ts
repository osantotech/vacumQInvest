// ============================================================
// VacumQInvest — Diário de operações
// ============================================================
// Timeline por ativo: cada sinal com o painel que o indicador mostrava no
// instante, o resultado quando fecha, e a anotação do trader.

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ------------------------------------------------------------------
// GET — timeline, opcionalmente filtrada por ativo
// ------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const auth = createClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ativo = request.nextUrl.searchParams.get('ativo');
  const limite = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get('limit') ?? '200', 10) || 200, 1),
    500
  );

  const service = createServiceClient();

  let query = service
    .from('alerts')
    .select(`
      id, created_at, ativo, timeframe, direcao, via_entrada,
      preco_entrada, stop, tp1, tp2,
      confianca_nota, confianca_score, mercado_nota, veredito,
      correlacao_btc, painel, anotacao,
      results ( preco_saida, data_saida, duracao_minutos, resultado_pct, status )
    `)
    .order('created_at', { ascending: false })
    .limit(limite);

  if (ativo) query = query.eq('ativo', ativo);

  const { data, error } = await query;

  if (error) {
    console.error('Falha ao carregar o diário:', error);
    return NextResponse.json({ error: 'Falha ao carregar', details: error.message }, { status: 500 });
  }

  // A lista de ativos vem de uma consulta própria: filtrar pelo resultado já
  // paginado deixaria de fora justamente os ativos mais antigos, que somem do
  // seletor no momento em que o histórico cresce.
  const { data: todos } = await service.from('alerts').select('ativo');
  const ativos = Array.from(new Set((todos ?? []).map(a => a.ativo))).sort();

  return NextResponse.json({ data: data ?? [], ativos });
}

// ------------------------------------------------------------------
// PATCH — grava a anotação do trader
// ------------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  const auth = createClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id?: string; anotacao?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: 'id não informado' }, { status: 400 });
  }

  // Texto vazio apaga a anotação; guardar string vazia faria a tela mostrar um
  // campo preenchido com nada.
  const texto = (body.anotacao ?? '').trim();

  const { error } = await createServiceClient()
    .from('alerts')
    .update({ anotacao: texto === '' ? null : texto })
    .eq('id', body.id);

  if (error) {
    return NextResponse.json({ error: 'Falha ao salvar', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

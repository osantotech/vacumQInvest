// ============================================================
// VacumQInvest — Trilha dos avisos de risco exibidos
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface AvisoRegistro {
  ativo?: string | null;
  tipo: string;
  gravidade: string;
  titulo: string;
  detalhe?: string | null;
  alavancagem?: number | null;
}

const TIPOS = ['stop_liquidacao', 'stop_apertado', 'correlacao_btc', 'concentracao_btc'];
const GRAVIDADES = ['critico', 'atencao'];

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { avisos?: AvisoRegistro[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const avisos = (body.avisos ?? []).filter(
    a => a && TIPOS.includes(a.tipo) && GRAVIDADES.includes(a.gravidade) && a.titulo
  );

  if (avisos.length === 0) {
    return NextResponse.json({ success: true, registrados: 0 });
  }

  const service = createServiceClient();

  // O dia é o de São Paulo, igual ao que a tela mostra: agrupar por UTC faria
  // um aviso das 22h aparecer no dia seguinte na auditoria.
  const dia = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });

  let registrados = 0;
  for (const a of avisos) {
    // Uma linha por usuário/ativo/tipo/dia. A cada nova exibição, só o contador
    // e o horário sobem — senão um F5 repetido encheria a tabela de linhas
    // idênticas sem acrescentar nada à prova.
    const { data: existente } = await service
      .from('avisos_exibidos')
      .select('id, vezes')
      .eq('user_id', user.id)
      .eq('dia', dia)
      .eq('tipo', a.tipo)
      .eq('ativo', a.ativo ?? '')
      .maybeSingle();

    if (existente) {
      await service
        .from('avisos_exibidos')
        .update({ vezes: existente.vezes + 1, ultima_vez: new Date().toISOString() })
        .eq('id', existente.id);
    } else {
      const { error } = await service.from('avisos_exibidos').insert({
        user_id: user.id,
        email: user.email ?? null,
        dia,
        ativo: a.ativo ?? '',
        tipo: a.tipo,
        gravidade: a.gravidade,
        titulo: a.titulo,
        detalhe: a.detalhe ?? null,
        alavancagem: a.alavancagem ?? null,
      });
      if (error) {
        console.error('Falha ao registrar aviso:', error.message);
        continue;
      }
    }
    registrados++;
  }

  return NextResponse.json({ success: true, registrados });
}

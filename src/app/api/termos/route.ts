// ============================================================
// VacumQInvest — Aceite de Termos
// ============================================================
// Trilha de auditoria: quem escreve é sempre o servidor, com a service role.
// Se o cliente pudesse inserir direto na tabela, ele poderia forjar (ou apagar)
// o próprio aceite — e uma trilha que o auditado controla não prova nada.

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { TERMO_VERSAO, TERMO_TITULO, TERMO_TEXTO, hashTermo } from '@/lib/termo';

export const dynamic = 'force-dynamic';

/**
 * O IP real fica no cabeçalho posto pelo proxy da Vercel; `x-forwarded-for`
 * pode trazer uma cadeia, e o primeiro item é o cliente.
 */
function clientIp(request: NextRequest): string | null {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip');
}

// ------------------------------------------------------------------
// GET — o usuário já aceitou a versão vigente?
// ------------------------------------------------------------------
export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from('termos_aceite')
    .select('created_at, versao')
    .eq('user_id', user.id)
    .eq('versao', TERMO_VERSAO)
    .maybeSingle();

  if (error) {
    console.error('Falha ao consultar aceite:', error);
    return NextResponse.json({ error: 'Falha ao consultar aceite' }, { status: 500 });
  }

  return NextResponse.json({
    aceito: Boolean(data),
    aceito_em: data?.created_at ?? null,
    versao: TERMO_VERSAO,
    titulo: TERMO_TITULO,
    texto: TERMO_TEXTO,
  });
}

// ------------------------------------------------------------------
// POST — registra o aceite
// ------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();

  // upsert e não insert: um duplo-clique no botão não pode virar erro na cara
  // do usuário nem uma segunda linha para a mesma versão.
  const { error } = await service
    .from('termos_aceite')
    .upsert({
      user_id: user.id,
      email: user.email ?? null,
      versao: TERMO_VERSAO,
      // Gravado no servidor a partir do texto do servidor: se viesse do corpo
      // da requisição, o cliente escolheria o que "aceitou".
      hash_conteudo: hashTermo(),
      ip: clientIp(request),
      user_agent: request.headers.get('user-agent'),
    }, { onConflict: 'user_id,versao' });

  if (error) {
    console.error('Falha ao registrar aceite:', error);
    return NextResponse.json({ error: 'Falha ao registrar aceite', details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, versao: TERMO_VERSAO });
}

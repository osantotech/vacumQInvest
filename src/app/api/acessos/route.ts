// ============================================================
// VacumQInvest — Gerenciamento de acessos
// ============================================================
// Rota sensível: cria contas e revoga acessos. Toda checagem de permissão é
// feita aqui no servidor. Esconder o botão no cliente não é controle de acesso.

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Devolve o e-mail do usuário logado se ele for admin; caso contrário, null.
 */
async function exigirAdmin(): Promise<{ email: string } | null> {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return null;

  const service = createServiceClient();
  const { data } = await service
    .from('approved_emails')
    .select('admin')
    .eq('email', user.email)
    .maybeSingle();

  return data?.admin ? { email: user.email } : null;
}

/** Senha provisória legível, para ser trocada no primeiro acesso. */
function senhaProvisoria(): string {
  return `vq-${randomBytes(6).toString('base64url')}`;
}

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ------------------------------------------------------------------
// GET — lista quem tem acesso
// ------------------------------------------------------------------
export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });

  const service = createServiceClient();

  const { data: aprovados, error } = await service
    .from('approved_emails')
    .select('id, email, admin, created_at')
    .order('created_at');

  if (error) {
    return NextResponse.json({ error: 'Falha ao listar', details: error.message }, { status: 500 });
  }

  // Cruza com o Auth para saber quem de fato já entrou: um e-mail autorizado
  // sem conta criada nunca consegue logar, e isso precisa ficar visível.
  const { data: authData } = await service.auth.admin.listUsers();
  const contas = new Map(
    (authData?.users ?? []).map(u => [u.email, { ultimo_login: u.last_sign_in_at, confirmado: Boolean(u.email_confirmed_at) }])
  );

  const { data: aceites } = await service.from('termos_aceite').select('email, created_at, versao');
  const aceitePorEmail = new Map((aceites ?? []).map(a => [a.email, a]));

  return NextResponse.json({
    admin_atual: admin.email,
    acessos: aprovados.map(a => ({
      ...a,
      tem_conta: contas.has(a.email),
      ultimo_login: contas.get(a.email)?.ultimo_login ?? null,
      aceitou_termo: aceitePorEmail.get(a.email)?.created_at ?? null,
      versao_termo: aceitePorEmail.get(a.email)?.versao ?? null,
    })),
  });
}

// ------------------------------------------------------------------
// POST — cria a conta e autoriza o e-mail
// ------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!emailValido(email)) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
  }

  const service = createServiceClient();
  const senha = senhaProvisoria();

  // As duas etapas são obrigatórias: sem conta a pessoa não consegue logar,
  // e sem autorização ela loga e é desconectada na sequência.
  const { error: erroConta } = await service.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true, // sem isto, o convidado fica preso esperando confirmação
  });

  // Conta já existente não é erro: pode ser um acesso revogado sendo devolvido.
  const jaExistia = Boolean(erroConta && /already/i.test(erroConta.message));
  if (erroConta && !jaExistia) {
    return NextResponse.json({ error: 'Falha ao criar a conta', details: erroConta.message }, { status: 500 });
  }

  const { error: erroAprovacao } = await service
    .from('approved_emails')
    .upsert({ email }, { onConflict: 'email' });

  if (erroAprovacao) {
    return NextResponse.json({ error: 'Falha ao autorizar', details: erroAprovacao.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    email,
    // A senha só existe nesta resposta: não fica gravada em lugar nenhum.
    senha_provisoria: jaExistia ? null : senha,
    conta_ja_existia: jaExistia,
  });
}

// ------------------------------------------------------------------
// DELETE — revoga o acesso
// ------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });

  const email = (new URL(request.url).searchParams.get('email') ?? '').trim().toLowerCase();
  if (!email) return NextResponse.json({ error: 'E-mail não informado' }, { status: 400 });

  if (email === admin.email) {
    return NextResponse.json(
      { error: 'Você não pode revogar o próprio acesso' },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  const { data: alvo } = await service
    .from('approved_emails')
    .select('admin')
    .eq('email', email)
    .maybeSingle();

  if (alvo?.admin) {
    // Sem esta trava, dois admins poderiam se revogar mutuamente e a
    // plataforma ficaria sem ninguém capaz de administrar pela interface.
    const { count } = await service
      .from('approved_emails')
      .select('*', { count: 'exact', head: true })
      .eq('admin', true);

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'Este é o último administrador — a plataforma ficaria sem quem a gerencie' },
        { status: 400 }
      );
    }
  }

  const { error } = await service.from('approved_emails').delete().eq('email', email);
  if (error) {
    return NextResponse.json({ error: 'Falha ao revogar', details: error.message }, { status: 500 });
  }

  // A conta no Auth é preservada de propósito: apagá-la deixaria órfão o
  // registro de aceite do termo, que é justamente o que precisa sobreviver.
  // Sem o e-mail em approved_emails, o login é recusado no callback.
  return NextResponse.json({ success: true, email });
}

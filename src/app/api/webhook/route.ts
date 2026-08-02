// ============================================================
// VacumQInvest — Webhook API Route (Entradas & Saídas)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';
import type { WebhookPayload, Alert } from '@/lib/types';
import { calculateDurationMinutes, calculateResultPct, calculateResultMarg } from '@/lib/calculations';
import {
  sendTelegramEntrada,
  sendTelegramScalp,
  sendTelegramScalpRealize,
  sendTelegramScalpStop,
  sendTelegramSpecial,
  logTelegram,
} from '@/lib/telegram';

/**
 * Comparação em tempo constante: `!==` sai no primeiro byte diferente, o que
 * deixa o tempo de resposta revelar quanto do segredo já está correto.
 */
function secretMatches(received: string | undefined, expected: string | undefined): boolean {
  if (!received || !expected) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Correlação de Pearson só existe entre -1 e 1. */
function parseCorrelacao(raw: string | undefined): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n < -1 || n > 1) return null;
  return n;
}

export async function POST(request: NextRequest) {
  try {
    const body: WebhookPayload = await request.json();

    // Validate webhook secret
    if (!secretMatches(body.secret, process.env.WEBHOOK_SECRET)) {
      return NextResponse.json(
        { error: 'Unauthorized: invalid secret' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // ============================================================
    // TRATAMENTO DE SAÍDA (tipo: "saida")
    // ============================================================
    if (body.tipo === 'saida') {
      if (!body.ativo || !body.preco_saida) {
        return NextResponse.json(
          { error: 'Missing required exit fields: ativo, preco_saida' },
          { status: 400 }
        );
      }

      // Buscar o alerta mais recente AINDA ABERTO para este ativo.
      // Pegar só o último alerta não basta: se ele já tiver resultado, uma
      // segunda saída gravaria um resultado duplicado no mesmo alerta.
      const { data: recentAlerts, error: alertErr } = await supabase
        .from('alerts')
        .select('*')
        .eq('ativo', body.ativo)
        .order('created_at', { ascending: false })
        .limit(20);

      if (alertErr || !recentAlerts || recentAlerts.length === 0) {
        return NextResponse.json(
          { error: `No active alert found for asset ${body.ativo}` },
          { status: 404 }
        );
      }

      const { data: closed, error: closedErr } = await supabase
        .from('results')
        .select('alert_id')
        .in('alert_id', recentAlerts.map(a => a.id));

      if (closedErr) {
        return NextResponse.json(
          { error: 'Failed to check open alerts', details: closedErr.message },
          { status: 500 }
        );
      }

      const closedIds = new Set((closed ?? []).map(r => r.alert_id));
      const latestAlert = recentAlerts.find(a => !closedIds.has(a.id));

      if (!latestAlert) {
        return NextResponse.json(
          { error: `No open alert found for asset ${body.ativo} (already closed)` },
          { status: 409 }
        );
      }

      const precoSaida = parseFloat(body.preco_saida);
      const dataSaida = new Date().toISOString();
      const duracaoMinutos = calculateDurationMinutes(latestAlert.created_at, dataSaida);

      const precoEntrada = latestAlert.preco_entrada || precoSaida;
      const pctResult = calculateResultPct(precoEntrada, precoSaida, latestAlert.direcao);
      const margResult = calculateResultMarg(pctResult);

      const resultData = {
        alert_id: latestAlert.id,
        preco_saida: precoSaida,
        data_saida: dataSaida,
        duracao_minutos: duracaoMinutos,
        resultado_pct: pctResult,
        resultado_marg: margResult,
        status: body.status || (pctResult >= 0 ? 'TP1' : 'STOP'),
      };

      const { data: result, error: resultErr } = await supabase
        .from('results')
        .insert(resultData)
        .select()
        .single();

      if (resultErr) {
        console.error('Failed to insert result:', resultErr);
        return NextResponse.json(
          { error: 'Failed to insert result', details: resultErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, type: 'saida', id: result.id, alert_id: latestAlert.id });
    }

    // ============================================================
    // TRATAMENTO DE ENTRADA (padrão)
    // ============================================================
    if (!body.ativo || !body.direcao) {
      return NextResponse.json(
        { error: 'Missing required entry fields: ativo, direcao' },
        { status: 400 }
      );
    }

    const alertData = {
      ativo: body.ativo,
      timeframe: body.timeframe || '30',
      indicador: body.indicador || 'VQ Pullback v1.8',
      direcao: body.direcao,
      preco_entrada: body.preco_entrada ? parseFloat(body.preco_entrada) : null,
      stop: body.stop ? parseFloat(body.stop) : null,
      tp1: body.tp1 ? parseFloat(body.tp1) : null,
      tp2: body.tp2 ? parseFloat(body.tp2) : null,
      tp3: body.tp3 ? parseFloat(body.tp3) : null,
      confianca_nota: body.confianca_nota ?? null,
      confianca_score: body.confianca_score ? parseInt(body.confianca_score, 10) : null,
      mercado_nota: body.mercado_nota ?? null,
      veredito: body.veredito ?? null,
      via_entrada: body.via_entrada ?? null,
      // Fora de [-1, 1] só pode ser lixo: descartar é melhor que gravar um
      // número que a tela vai transformar num aviso de risco falso.
      correlacao_btc: parseCorrelacao(body.correlacao_btc),
      origem: 'webhook' as const,
      webhook_raw: body as unknown as Record<string, unknown>,
    };

    const { data: alert, error: insertError } = await supabase
      .from('alerts')
      .insert(alertData)
      .select()
      .single();

    if (insertError || !alert) {
      console.error('Failed to insert alert:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert alert', details: insertError?.message },
        { status: 500 }
      );
    }

    const typedAlert = alert as Alert;

    // Dispatch Telegram message
    let telegramOk = false;
    let telegramTipo: 'entrada' | 'saida' | 'scalp_realize' | 'scalp_stop' = 'entrada';

    try {
      switch (body.direcao) {
        case 'LONG':
        case 'SHORT':
          telegramOk = await sendTelegramEntrada(typedAlert);
          telegramTipo = 'entrada';
          break;

        case 'SCALP_SHORT':
        case 'SCALP_LONG':
          telegramOk = await sendTelegramScalp(typedAlert);
          telegramTipo = 'entrada';
          break;

        case 'SCALP_REALIZE':
          telegramOk = await sendTelegramScalpRealize(typedAlert);
          telegramTipo = 'scalp_realize';
          break;

        case 'SCALP_STOP':
          telegramOk = await sendTelegramScalpStop(typedAlert);
          telegramTipo = 'scalp_stop';
          break;

        case 'FIBO_ROMPEU':
        case 'EXAUSTAO':
          telegramOk = await sendTelegramSpecial(typedAlert);
          telegramTipo = 'entrada';
          break;

        default:
          console.warn('Unknown direcao:', body.direcao);
      }

      await logTelegram(
        supabase,
        typedAlert.id,
        telegramTipo,
        telegramOk ? 'sent' : 'error',
        telegramOk ? undefined : 'Telegram API returned ok=false'
      );
    } catch (telegramError) {
      const errMsg = telegramError instanceof Error ? telegramError.message : 'Unknown telegram error';
      console.error('Telegram send failed:', errMsg);
      await logTelegram(supabase, typedAlert.id, telegramTipo, 'error', errMsg);
    }

    return NextResponse.json({ success: true, type: 'entrada', id: typedAlert.id });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

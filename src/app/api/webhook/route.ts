// ============================================================
// VacumQInvest — Webhook API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { WebhookPayload, Alert } from '@/lib/types';
import {
  sendTelegramEntrada,
  sendTelegramScalp,
  sendTelegramScalpRealize,
  sendTelegramScalpStop,
  sendTelegramSpecial,
  logTelegram,
} from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body: WebhookPayload = await request.json();

    // Validate webhook secret
    if (!body.secret || body.secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized: invalid secret' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // Build alert record
    const alertData = {
      ativo: body.ativo,
      timeframe: body.timeframe,
      indicador: body.indicador,
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

    // Dispatch Telegram message based on direcao
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

    return NextResponse.json({ success: true, id: typedAlert.id });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

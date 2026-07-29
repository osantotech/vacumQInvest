// ============================================================
// VacumQInvest — Alerts API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { Alert } from '@/lib/types';
import {
  sendTelegramEntrada,
  sendTelegramScalp,
  sendTelegramScalpRealize,
  sendTelegramScalpStop,
  sendTelegramSpecial,
  logTelegram,
} from '@/lib/telegram';

// ------------------------------------------------------------------
// POST — Create alert manually (authenticated)
// ------------------------------------------------------------------
export async function POST(request: NextRequest) {
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

    const body = await request.json();

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
      origem: 'manual' as const,
      webhook_raw: null,
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

    // Use service client for Telegram logging (no RLS restrictions)
    const serviceClient = createServiceClient();

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
      }

      await logTelegram(
        serviceClient,
        typedAlert.id,
        telegramTipo,
        telegramOk ? 'sent' : 'error',
        telegramOk ? undefined : 'Telegram API returned ok=false'
      );
    } catch (telegramError) {
      const errMsg = telegramError instanceof Error ? telegramError.message : 'Unknown telegram error';
      console.error('Telegram send failed:', errMsg);
      await logTelegram(serviceClient, typedAlert.id, telegramTipo, 'error', errMsg);
    }

    return NextResponse.json({ success: true, id: typedAlert.id, alert: typedAlert });
  } catch (error) {
    console.error('Alert creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------------
// GET — List alerts with filters and pagination
// ------------------------------------------------------------------
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const indicador = searchParams.get('indicador');
    const ativo = searchParams.get('ativo');
    const direcao = searchParams.get('direcao');
    const status = searchParams.get('status'); // 'open' or 'closed'
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    const offset = (page - 1) * limit;

    // Build query with left join to results
    let query = supabase
      .from('alerts')
      .select('*, results(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (indicador) {
      query = query.eq('indicador', indicador);
    }
    if (ativo) {
      query = query.eq('ativo', ativo);
    }
    if (direcao) {
      query = query.eq('direcao', direcao);
    }

    const { data: alerts, error: queryError, count } = await query;

    if (queryError) {
      console.error('Failed to fetch alerts:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch alerts', details: queryError.message },
        { status: 500 }
      );
    }

    // Filter by open/closed status (based on whether a result exists)
    let filteredAlerts = alerts ?? [];
    if (status === 'open') {
      filteredAlerts = filteredAlerts.filter(
        (a: Record<string, unknown>) => {
          const results = a.results as unknown[] | null;
          return !results || (Array.isArray(results) && results.length === 0);
        }
      );
    } else if (status === 'closed') {
      filteredAlerts = filteredAlerts.filter(
        (a: Record<string, unknown>) => {
          const results = a.results as unknown[] | null;
          return results && Array.isArray(results) && results.length > 0;
        }
      );
    }

    return NextResponse.json({
      data: filteredAlerts,
      pagination: {
        page,
        limit,
        total: count ?? 0,
      },
    });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

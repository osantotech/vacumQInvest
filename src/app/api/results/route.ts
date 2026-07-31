// ============================================================
// VacumQInvest — Results API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { Alert, Result, ResultPayload } from '@/lib/types';
import {
  calculateResultPct,
  calculateResultMarg,
  calculateDurationMinutes,
} from '@/lib/calculations';
import { sendTelegramSaida, logTelegram } from '@/lib/telegram';

// ------------------------------------------------------------------
// POST — Create a result for an alert
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

    const body: ResultPayload = await request.json();

    if (!body.alert_id || body.preco_saida === undefined || !body.data_saida || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields: alert_id, preco_saida, data_saida, status' },
        { status: 400 }
      );
    }

    // Fetch the associated alert
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', body.alert_id)
      .single();

    if (alertError || !alert) {
      return NextResponse.json(
        { error: 'Alert not found', details: alertError?.message },
        { status: 404 }
      );
    }

    const typedAlert = alert as Alert;

    // Calculate resultado_pct, resultado_marg, and duracao_minutos
    let resultado_pct: number | null = null;
    let resultado_marg: number | null = null;
    let duracao_minutos: number | null = null;

    if (typedAlert.preco_entrada !== null) {
      resultado_pct = calculateResultPct(
        typedAlert.preco_entrada,
        body.preco_saida,
        typedAlert.direcao
      );
      resultado_marg = calculateResultMarg(resultado_pct);
    }

    duracao_minutos = calculateDurationMinutes(
      typedAlert.created_at,
      body.data_saida
    );

    // Insert result
    const resultData = {
      alert_id: body.alert_id,
      preco_saida: body.preco_saida,
      data_saida: body.data_saida,
      duracao_minutos,
      resultado_pct,
      resultado_marg,
      status: body.status,
      observacao: body.observacao ?? null,
      telegram_sent: false,
    };

    const { data: savedResult, error: insertError } = await supabase
      .from('results')
      .insert(resultData)
      .select()
      .single();

    if (insertError || !savedResult) {
      console.error('Failed to insert result:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert result', details: insertError?.message },
        { status: 500 }
      );
    }

    const typedResult = savedResult as Result;

    // Send Telegram exit message
    const serviceClient = createServiceClient();
    try {
      const telegramOk = await sendTelegramSaida(typedAlert, typedResult);

      // Update telegram_sent flag
      if (telegramOk) {
        await supabase
          .from('results')
          .update({ telegram_sent: true })
          .eq('id', typedResult.id);
      }

      await logTelegram(
        serviceClient,
        typedAlert.id,
        'saida',
        telegramOk ? 'sent' : 'error',
        telegramOk ? undefined : 'Telegram API returned ok=false'
      );
    } catch (telegramError) {
      const errMsg = telegramError instanceof Error ? telegramError.message : 'Unknown telegram error';
      console.error('Telegram send failed:', errMsg);
      await logTelegram(serviceClient, typedAlert.id, 'saida', 'error', errMsg);
    }

    return NextResponse.json({
      success: true,
      result: typedResult,
    });
  } catch (error) {
    console.error('Result creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------------
// GET — List results with filters and pagination
// ------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();

    const { searchParams } = new URL(request.url);
    const indicador = searchParams.get('indicador');
    const ativo = searchParams.get('ativo');
    const scalpOnly = searchParams.get('scalp_only') === 'true';
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);

    const offset = (page - 1) * limit;

    // Query results joined with alerts (explicit column selection to avoid missing column errors)
    let query = supabase
      .from('results')
      .select(`
        id,
        preco_saida,
        data_saida,
        duracao_minutos,
        status,
        resultado_pct,
        resultado_marg,
        alerts!inner (
          id,
          created_at,
          ativo,
          timeframe,
          indicador,
          direcao,
          preco_entrada
        )
      `, { count: 'exact' })
      .order('data_saida', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters on the joined alerts table
    if (indicador) {
      query = query.eq('alerts.indicador', indicador);
    }
    if (ativo) {
      query = query.eq('alerts.ativo', ativo);
    }
    if (scalpOnly) {
      query = query.in('alerts.direcao', ['SCALP_SHORT', 'SCALP_LONG']);
    }

    const { data: results, error: queryError, count } = await query;

    if (queryError) {
      console.error('Failed to fetch results:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch results', details: queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: results ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
      },
    });
  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// VacumQInvest — Three-X Operations API Route
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ThreeXPayload, ThreeXOperation } from '@/lib/types';
import {
  calculateResultPct,
  calculateResultMarg,
} from '@/lib/calculations';

// ------------------------------------------------------------------
// POST — Create a 3X operation
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

    const body: ThreeXPayload = await request.json();

    if (
      !body.ativo ||
      !body.data_operacao ||
      body.entrada_original === undefined ||
      body.entrada_3x === undefined ||
      body.saida === undefined
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: ativo, data_operacao, entrada_original, entrada_3x, saida',
        },
        { status: 400 }
      );
    }

    // Calculate resultado_pct and resultado_marg based on entrada_3x and saida
    // 3X operations are always treated as LONG direction from the 3x entry
    const resultado_pct = calculateResultPct(body.entrada_3x, body.saida, 'LONG');
    const resultado_marg = calculateResultMarg(resultado_pct);

    const operationData = {
      alert_id: body.alert_id ?? null,
      ativo: body.ativo,
      data_operacao: body.data_operacao,
      entrada_original: body.entrada_original,
      entrada_3x: body.entrada_3x,
      saida: body.saida,
      resultado_pct: Math.round(resultado_pct * 100) / 100,
      resultado_marg: Math.round(resultado_marg * 100) / 100,
      observacao: body.observacao ?? null,
    };

    const { data: operation, error: insertError } = await supabase
      .from('three_x_operations')
      .insert(operationData)
      .select()
      .single();

    if (insertError || !operation) {
      console.error('Failed to insert 3X operation:', insertError);
      return NextResponse.json(
        { error: 'Failed to insert 3X operation', details: insertError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      operation: operation as ThreeXOperation,
    });
  } catch (error) {
    console.error('3X operation creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ------------------------------------------------------------------
// GET — List 3X operations with pagination
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
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    const offset = (page - 1) * limit;

    const { data: operations, error: queryError, count } = await supabase
      .from('three_x_operations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (queryError) {
      console.error('Failed to fetch 3X operations:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch 3X operations', details: queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: (operations ?? []) as ThreeXOperation[],
      pagination: {
        page,
        limit,
        total: count ?? 0,
      },
    });
  } catch (error) {
    console.error('3X operations fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

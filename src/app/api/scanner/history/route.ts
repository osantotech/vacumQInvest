import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const searchParams = request.nextUrl.searchParams;
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('scanner_signals')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  const ativo = searchParams.get('ativo');
  if (ativo) query = query.eq('ativo', ativo);

  const fase = searchParams.get('fase');
  if (fase) query = query.eq('fase', fase);

  const direcao = searchParams.get('direcao');
  if (direcao) query = query.eq('direcao', direcao);

  const timeframe = searchParams.get('timeframe');
  if (timeframe) query = query.eq('timeframe', timeframe);

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    signals: data,
    totalPages: count ? Math.ceil(count / limit) : 1,
    total: count
  });
}

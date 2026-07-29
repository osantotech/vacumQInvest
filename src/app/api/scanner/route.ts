import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { analyzeVQPullback, type Kline, type VQSignal } from '@/lib/vqScanner';
import { sendTelegramScanner } from '@/lib/telegram';

export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel Hobby max execution time

const TIMEFRAMES = ['15m', '30m', '2h', '4h'];

async function fetchBinanceKlines(symbol: string, interval: string): Promise<Kline[]> {
  try {
    const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=200`);
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.map((d: (string | number)[]) => ({
      timestamp: d[0],
      open: typeof d[1] === 'string' ? parseFloat(d[1]) : d[1],
      high: typeof d[2] === 'string' ? parseFloat(d[2]) : d[2],
      low: typeof d[3] === 'string' ? parseFloat(d[3]) : d[3],
      close: typeof d[4] === 'string' ? parseFloat(d[4]) : d[4],
      volume: typeof d[5] === 'string' ? parseFloat(d[5]) : d[5]
    }));
  } catch (error) {
    console.error(`Error fetching Binance for ${symbol} ${interval}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  // Autenticação opcional: Vercel CRON_SECRET ou manual
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
    !request.nextUrl.searchParams.has('manual')
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // 1. Obter moedas ativas
  const { data: watchlist, error: watchErr } = await supabase
    .from('scanner_watchlist')
    .select('symbol')
    .eq('ativo', true);

  if (watchErr || !watchlist || watchlist.length === 0) {
    return NextResponse.json({ error: 'No active symbols in watchlist' }, { status: 400 });
  }

  const symbols = watchlist.map(w => w.symbol);
  
  // Vercel Limit Strategy: process at most 10 symbols per run (40 requests)
  // To rotate, you can sort randomly or store the last processed index.
  // For simplicity and fitting 10s, we will randomly pick 5 symbols to scan if list > 5.
  const shuffledSymbols = symbols.sort(() => 0.5 - Math.random());
  const selectedSymbols = shuffledSymbols.slice(0, 10);

  const newSignals: VQSignal[] = [];

  // 2. Fetch data parallelly
  for (const symbol of selectedSymbols) {
    const promises = TIMEFRAMES.map(async (tf) => {
      const klines = await fetchBinanceKlines(symbol, tf);
      if (klines.length > 0) {
        const signal = analyzeVQPullback(klines, symbol, tf);
        if (signal) {
          // Checar duplicatas nas últimas 4 horas
          const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
          const { data: existing } = await supabase
            .from('scanner_signals')
            .select('id')
            .eq('ativo', symbol)
            .eq('timeframe', tf)
            .eq('fase', signal.fase)
            .gte('created_at', fourHoursAgo)
            .limit(1);

          if (!existing || existing.length === 0) {
            newSignals.push(signal);
          }
        }
      }
    });

    await Promise.all(promises);
  }

  // 3. Salvar no banco e notificar
  let insertedCount = 0;
  for (const signal of newSignals) {
    const { data: inserted, error: insertErr } = await supabase
      .from('scanner_signals')
      .insert({
        ativo: signal.ativo,
        timeframe: signal.timeframe,
        fase: signal.fase,
        direcao: signal.direcao,
        brk_price: signal.brk_price,
        close_atual: signal.close_atual,
        sma8: signal.sma8,
        sma21: signal.sma21,
        sma200: signal.sma200,
        fib_382: signal.fib_382,
        fib_618: signal.fib_618,
        score_pbv: signal.score_pbv,
        fatores: signal.fatores
      })
      .select('id')
      .single();

    if (!insertErr && inserted) {
      insertedCount++;
      // Apenas notificar se for Fase final (PBv score>=3 ou PPB_EC)
      if (signal.fase === 'PBv' || signal.fase === 'PPB_EC') {
        const sent = await sendTelegramScanner(signal);
        if (sent) {
          await supabase.from('scanner_signals').update({ telegram_sent: true }).eq('id', inserted.id);
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    scanned_symbols: selectedSymbols,
    signals_found: newSignals.length,
    signals_inserted: insertedCount
  });
}

// ============================================================
// VacumQInvest — Telegram Bot API Integration
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Alert,
  Result,
  TelegramTipo,
  TelegramStatus,
} from '@/lib/types';
import {
  formatDateTelegram,
  calculateStopPct,
  calculateResultMarg,
  formatDuration,
  formatPrice,
  calculateResultPct,
} from '@/lib/calculations';
import type { VQSignal } from '@/lib/vqScanner';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID!;

// ------------------------------------------------------------------
// Low-level: send HTML message to Telegram channel
// ------------------------------------------------------------------
export async function sendToChannel(text: string): Promise<{ ok: boolean; description?: string }> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHANNEL_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const data = await res.json();
  return { ok: data.ok, description: data.description };
}

// ------------------------------------------------------------------
// Log Telegram send attempt to database
// ------------------------------------------------------------------
export async function logTelegram(
  supabase: SupabaseClient,
  alertId: string,
  tipo: TelegramTipo,
  status: TelegramStatus,
  errorMsg?: string
): Promise<void> {
  await supabase.from('telegram_log').insert({
    alert_id: alertId,
    tipo,
    status,
    error_msg: errorMsg ?? null,
  });
}

// ------------------------------------------------------------------
// LONG / SHORT → sendTelegramEntrada
// ------------------------------------------------------------------
export async function sendTelegramEntrada(alert: Alert): Promise<boolean> {
  const isLong = alert.direcao === 'LONG';
  const icon = isLong ? '🟢' : '🔴';
  const label = isLong ? 'COMPRE ▲' : 'VENDA ▼';

  const entrada = formatPrice(alert.preco_entrada);

  let stopLine = '';
  if (alert.preco_entrada !== null && alert.stop !== null) {
    const stopPct = calculateStopPct(alert.preco_entrada, alert.stop, alert.direcao);
    // const stopMarg = calculateStopMarg(stopPct);
    stopLine = `🛑 Stop: ${formatPrice(alert.stop)} (-${Math.abs(stopPct).toFixed(1)}% · 20x)`;
  } else {
    stopLine = `🛑 Stop: ${formatPrice(alert.stop)}`;
  }

  const tpParts: string[] = [];
  if (alert.tp1 !== null) tpParts.push(`TP1: ${formatPrice(alert.tp1)}`);
  if (alert.tp2 !== null) tpParts.push(`TP2: ${formatPrice(alert.tp2)}`);
  if (alert.tp3 !== null) tpParts.push(`TP3: ${formatPrice(alert.tp3)}`);
  const tpLine = tpParts.length > 0 ? `🎯 ${tpParts.join(' · ')}` : '';

  const confianca =
    alert.confianca_nota && alert.confianca_score !== null
      ? `${alert.confianca_nota} (${alert.confianca_score})`
      : alert.confianca_nota ?? '—';

  const mercado = alert.mercado_nota ?? '—';
  const via = alert.via_entrada ? `✅ Via ${alert.via_entrada.toUpperCase()} (rejeição da zona)` : '';
  const veredito = alert.veredito ? `💬 ${alert.veredito}` : '';
  const dateLine = `📅 ${formatDateTelegram(alert.created_at)}`;

  const lines = [
    `${icon} ${label} — ${alert.ativo} · ${alert.timeframe}`,
    '━━━━━━━━━━━━━━━━',
    `📊 ${alert.indicador}`,
    `💰 Entrada: ${entrada}`,
    stopLine,
    tpLine,
    '━━━━━━━━━━━━━━━━',
    `🧠 Confiança: ${confianca} · Mercado: ${mercado}`,
    via,
    veredito,
    dateLine,
  ].filter(Boolean);

  const text = lines.join('\n');
  const result = await sendToChannel(text);
  return result.ok;
}

// ------------------------------------------------------------------
// SCALP_SHORT / SCALP_LONG → sendTelegramScalp
// ------------------------------------------------------------------
export async function sendTelegramScalp(alert: Alert): Promise<boolean> {
  const isShort = alert.direcao === 'SCALP_SHORT';
  const label = isShort ? 'SCALP SHORT s' : 'SCALP LONG l';

  const entrada = formatPrice(alert.preco_entrada);

  let stopLine = '';
  if (alert.preco_entrada !== null && alert.stop !== null) {
    const stopPct = calculateStopPct(alert.preco_entrada, alert.stop, alert.direcao);
    stopLine = `🛑 Stop: ${formatPrice(alert.stop)} (-${Math.abs(stopPct).toFixed(1)}%)`;
  } else {
    stopLine = `🛑 Stop: ${formatPrice(alert.stop)}`;
  }

  const alvo =
    alert.tp1 !== null
      ? `🎯 Alvo: ${formatPrice(alert.tp1)} (Modo B-Trilha)`
      : '';

  const dateLine = `📅 ${formatDateTelegram(alert.created_at)}`;

  const lines = [
    `⚡ ${label} — ${alert.ativo} · ${alert.timeframe}`,
    '━━━━━━━━━━━━━━━━',
    `📊 ${alert.indicador}`,
    `💰 Entrada: ${entrada}`,
    stopLine,
    alvo,
    dateLine,
  ].filter(Boolean);

  const text = lines.join('\n');
  const result = await sendToChannel(text);
  return result.ok;
}

// ------------------------------------------------------------------
// Manual exit → sendTelegramSaida
// ------------------------------------------------------------------
export async function sendTelegramSaida(
  alert: Alert,
  result: Result
): Promise<boolean> {
  const entrada = formatPrice(alert.preco_entrada);
  const saida = formatPrice(result.preco_saida);

  let duracao = '—';
  if (result.duracao_minutos !== null) {
    duracao = formatDuration(result.duracao_minutos);
  }

  const resultadoMarg =
    result.resultado_marg !== null
      ? `${result.resultado_marg >= 0 ? '+' : ''}${result.resultado_marg.toFixed(1)}% de margem (20x)`
      : '—';

  const statusLabel = result.status === 'STOP' ? 'STOP atingido' : `${result.status} atingido`;
  const dateLine = `📅 ${formatDateTelegram(result.data_saida)}`;

  const lines = [
    `✅ ENCERRADO — ${alert.ativo} · ${alert.timeframe}`,
    '━━━━━━━━━━━━━━━━',
    `📊 ${alert.indicador}`,
    `📥 Entrada: ${entrada} · 📤 Saída: ${saida}`,
    `⏱ Duração: ${duracao}`,
    '━━━━━━━━━━━━━━━━',
    `💰 Resultado: ${resultadoMarg}`,
    `🏆 Status: ${statusLabel}`,
    dateLine,
  ];

  const text = lines.join('\n');
  const sendResult = await sendToChannel(text);
  return sendResult.ok;
}

// ------------------------------------------------------------------
// SCALP_REALIZE → sendTelegramScalpRealize
// ------------------------------------------------------------------
export async function sendTelegramScalpRealize(alert: Alert): Promise<boolean> {
  const spreadMarg =
    alert.preco_entrada !== null && alert.tp1 !== null
      ? calculateResultMarg(
          calculateResultPct(alert.preco_entrada, alert.tp1, alert.direcao)
        )
      : null;

  const spreadStr =
    spreadMarg !== null
      ? `${spreadMarg >= 0 ? '+' : ''}${spreadMarg.toFixed(1)}% de margem`
      : '—';

  const dateLine = `📅 ${formatDateTelegram(alert.created_at)}`;

  const lines = [
    `💚 SCALP REALIZOU — ${alert.ativo} · ${alert.timeframe}`,
    '━━━━━━━━━━━━━━━━',
    `📊 ${alert.indicador}`,
    `⚡ Spread: ${spreadStr}`,
    `⏱ Duração: ~${alert.veredito ?? '—'}`,
    dateLine,
  ];

  const text = lines.join('\n');
  const result = await sendToChannel(text);
  return result.ok;
}

// ------------------------------------------------------------------
// SCALP_STOP → sendTelegramScalpStop
// ------------------------------------------------------------------
export async function sendTelegramScalpStop(alert: Alert): Promise<boolean> {
  const resultadoMarg =
    alert.preco_entrada !== null && alert.stop !== null
      ? calculateResultMarg(
          calculateResultPct(alert.preco_entrada, alert.stop, alert.direcao)
        )
      : null;

  const resultStr =
    resultadoMarg !== null
      ? `${resultadoMarg >= 0 ? '+' : ''}${resultadoMarg.toFixed(1)}% de margem`
      : '—';

  const dateLine = `📅 ${formatDateTelegram(alert.created_at)}`;

  const lines = [
    `🔴 SCALP STOP — ${alert.ativo} · ${alert.timeframe}`,
    '━━━━━━━━━━━━━━━━',
    `📊 ${alert.indicador}`,
    `📉 Resultado: ${resultStr}`,
    `⏱ Duração: ~${alert.veredito ?? '—'}`,
    dateLine,
  ];

  const text = lines.join('\n');
  const result = await sendToChannel(text);
  return result.ok;
}

// ------------------------------------------------------------------
// FIBO_ROMPEU / EXAUSTAO → sendTelegramSpecial
// ------------------------------------------------------------------
export async function sendTelegramSpecial(alert: Alert): Promise<boolean> {
  const dateLine = `${formatDateTelegram(alert.created_at)}`;

  let text = '';

  if (alert.direcao === 'FIBO_ROMPEU') {
    text = [
      `🟣 FIBO ROMPEU — ${alert.ativo} · ${alert.timeframe}`,
      'Setup morto. Preço passou do limite 0.786.',
      `📊 ${alert.indicador} · ${dateLine}`,
    ].join('\n');
  } else if (alert.direcao === 'EXAUSTAO') {
    text = [
      `🔴 EXAUSTÃO — ${alert.ativo} · ${alert.timeframe}`,
      '5+ velas na mesma direção. Repique provável.',
      `📊 ${alert.indicador} · ${dateLine}`,
    ].join('\n');
  }

  if (!text) return false;

  const result = await sendToChannel(text);
  return result.ok;
}

// ------------------------------------------------------------------
// VQ Scanner → sendTelegramScanner
// ------------------------------------------------------------------
export async function sendTelegramScanner(signal: VQSignal): Promise<boolean> {
  const icon = '⚡';
  const label = 'VQ PULLBACK';

  const dateLine = `📅 ${formatDateTelegram(new Date().toISOString())}`;
  
  const scoreIcon = (val: boolean) => val ? '✅' : '⬜';

  const lines = [
    `${icon} ${label} — ${signal.ativo} · ${signal.timeframe}`,
    '━━━━━━━━━━━━━━━━',
    `📍 Fase: ${signal.fase} (Score ${signal.score_pbv}/5)`,
    `📊 Direção: ${signal.direcao}`,
    `💰 Brk Price: ${formatPrice(signal.brk_price)}`,
    `📈 Close: ${formatPrice(signal.close_atual)}`,
    '━━━━━━━━━━━━━━━━',
    `${scoreIcon(signal.fatores.vol_5x)} Vol 5× reversão`,
    `${scoreIcon(signal.fatores.vol_caindo)} Vol caindo`,
    `${scoreIcon(signal.fatores.zona_fibo)} Zona Fib 0.382–0.618`,
    `${scoreIcon(signal.fatores.toque_sma)} Toque + fechamento SMA8`,
    `${scoreIcon(signal.fatores.candle_forte)} Candle forte`,
    dateLine,
  ];

  const text = lines.join('\n');
  const result = await sendToChannel(text);
  return result.ok;
}

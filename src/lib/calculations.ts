// ============================================================
// VacumQInvest — Business Calculations
// ============================================================

export const LEVERAGE = 20;

/**
 * A perda na margem nunca passa de -100%: nesse ponto a margem acabou e a
 * corretora liquida a posição. Reportar -140% descreve uma operação que não
 * existiu.
 */
const MAX_LOSS_MARG = -100;

/**
 * Preço adverso (em %) que zera a margem na alavancagem usada — ~5% a 20x.
 * Ignora taxas e a margem de manutenção, então a liquidação real acontece um
 * pouco antes disto.
 */
export const LIQUIDATION_PCT = 100 / LEVERAGE;

/** SHORT, SCALP_SHORT e qualquer variante futura invertem o sinal do P&L. */
function isShort(direcao: string): boolean {
  return (direcao || '').toUpperCase().includes('SHORT');
}

/**
 * Calculate P&L percentage from entry and exit prices
 */
export function calculateResultPct(
  precoEntrada: number,
  precoSaida: number,
  direcao: string
): number {
  if (precoEntrada === 0) return 0;

  if (isShort(direcao)) {
    return ((precoEntrada - precoSaida) / precoEntrada) * 100;
  }

  return ((precoSaida - precoEntrada) / precoEntrada) * 100;
}

/**
 * Calculate margin P&L (leveraged), capped at total loss of margin.
 */
export function calculateResultMarg(resultadoPct: number): number {
  return calculateResultMargAt(resultadoPct, LEVERAGE);
}

/**
 * Mesma conta, com a alavancagem escolhida na tela.
 *
 * O teto de -100% vale em qualquer alavancagem: em 150x bastam 0,67% contra
 * para zerar a margem, e tudo além disso é perda que a corretora nunca deixou
 * acontecer — a posição já tinha sido liquidada.
 */
export function calculateResultMargAt(resultadoPct: number, leverage: number): number {
  return Math.max(resultadoPct * leverage, MAX_LOSS_MARG);
}

/**
 * True quando o movimento adverso consumiu toda a margem — a posição teria
 * sido liquidada antes de chegar ao preço de saída informado.
 */
export function isLiquidated(resultadoPct: number): boolean {
  return resultadoPct * LEVERAGE <= MAX_LOSS_MARG;
}

/**
 * Calculate stop loss percentage
 */
export function calculateStopPct(
  precoEntrada: number,
  stop: number,
  direcao: string
): number {
  if (precoEntrada === 0) return 0;

  if (isShort(direcao)) {
    return ((stop - precoEntrada) / precoEntrada) * 100;
  }

  return ((precoEntrada - stop) / precoEntrada) * 100;
}

/**
 * Calculate margin stop loss percentage.
 *
 * `stopPct` é a distância do stop expressa como risco positivo, então o teto
 * aqui é +100%: um stop mais largo que a liquidação nunca chega a ser
 * executado — a corretora fecha a posição antes.
 */
export function calculateStopMarg(stopPct: number): number {
  return Math.min(stopPct * LEVERAGE, 100);
}

/**
 * True quando o stop está mais longe que o preço de liquidação — o stop é
 * decorativo, a posição morre antes de chegar nele.
 */
export function isStopBeyondLiquidation(stopPct: number): boolean {
  return stopPct >= LIQUIDATION_PCT;
}

/**
 * Calculate duration in minutes between two dates
 */
export function calculateDurationMinutes(
  dateStart: string | Date,
  dateEnd: string | Date
): number {
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Format duration in minutes to human readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/**
 * Format a number with Brazilian locale
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format price for display
 */
export function formatPrice(value: number | null): string {
  if (value === null || value === undefined) return '—';
  if (value >= 1) return formatNumber(value, 2);
  return formatNumber(value, 8);
}

/**
 * Format percentage with sign
 */
export function formatPct(value: number | null, decimals: number = 1): string {
  if (value === null || value === undefined) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatNumber(value, decimals)}%`;
}

/**
 * Format date to BR timezone (UTC-3)
 */
export function formatDateBR(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
    year: undefined,
  });
}

/**
 * Format date and time to BR timezone
 */
export function formatDateTimeBR(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
  });
  const time = date.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${day} ${time}`;
}

/**
 * Data e hora completas: 01/08/2026 21:07.
 *
 * Diferente de formatDateTimeBR (01/ago 21:07), que é para leitura rápida.
 * Nas tabelas de auditoria o ano precisa aparecer e as duas datas de uma linha
 * são comparadas a olho — a coluna Tempo é exatamente a diferença entre elas.
 */
export function formatDateTimeFullBR(dateStr: string): string {
  const d = new Date(dateStr);
  const data = d.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const hora = d.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${data} ${hora}`;
}

/**
 * Duração entre duas datas, já formatada.
 *
 * Deriva das mesmas duas datas que a linha exibe, em vez de confiar na coluna
 * `duracao_minutos` gravada: assim o que aparece em Tempo é sempre a subtração
 * do que está na tela, mesmo em registros antigos gravados sem a coluna.
 */
export function formatDurationBetween(
  dateStart: string | Date,
  dateEnd: string | Date
): string {
  const minutos = calculateDurationMinutes(dateStart, dateEnd);
  if (!Number.isFinite(minutos) || minutos < 0) return '—';
  // Entrada e saída no mesmo minuto é operação relâmpago, não dado faltando.
  if (minutos === 0) return '<1min';
  return formatDuration(minutos);
}

/**
 * Format date for Telegram (15/jul 09:32 UTC-3)
 */
export function formatDateTelegram(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                  'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  const options: Intl.DateTimeFormatOptions = { timeZone: 'America/Sao_Paulo' };
  const brDate = new Date(date.toLocaleString('en-US', options));

  const day = brDate.getDate().toString().padStart(2, '0');
  const month = months[brDate.getMonth()];
  const hours = brDate.getHours().toString().padStart(2, '0');
  const mins = brDate.getMinutes().toString().padStart(2, '0');

  return `${day}/${month} ${hours}:${mins} UTC-3`;
}

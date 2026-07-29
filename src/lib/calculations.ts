// ============================================================
// VacumQInvest — Business Calculations
// ============================================================

const LEVERAGE = 20;

/**
 * Calculate P&L percentage from entry and exit prices
 */
export function calculateResultPct(
  precoEntrada: number,
  precoSaida: number,
  direcao: string
): number {
  if (precoEntrada === 0) return 0;

  if (direcao === 'SHORT' || direcao === 'SCALP_SHORT') {
    return ((precoEntrada - precoSaida) / precoEntrada) * 100;
  }

  return ((precoSaida - precoEntrada) / precoEntrada) * 100;
}

/**
 * Calculate margin P&L (leveraged)
 */
export function calculateResultMarg(resultadoPct: number): number {
  return resultadoPct * LEVERAGE;
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

  if (direcao === 'SHORT' || direcao === 'SCALP_SHORT') {
    return ((stop - precoEntrada) / precoEntrada) * 100;
  }

  return ((precoEntrada - stop) / precoEntrada) * 100;
}

/**
 * Calculate margin stop loss percentage
 */
export function calculateStopMarg(stopPct: number): number {
  return stopPct * LEVERAGE;
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

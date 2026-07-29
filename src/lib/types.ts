// ============================================================
// VacumQInvest — TypeScript Types
// ============================================================

export type DirecaoType =
  | 'LONG'
  | 'SHORT'
  | 'SCALP_SHORT'
  | 'SCALP_LONG'
  | 'SCALP_REALIZE'
  | 'SCALP_STOP'
  | 'FIBO_ROMPEU'
  | 'EXAUSTAO';

export type ConfiancaNota = 'A+' | 'A' | 'B' | 'C' | 'D';
export type MercadoNota = 'FORTE' | 'OK' | 'FRACO';
export type ViaEntrada = 'FIBO' | 'FORÇA' | null;
export type Origem = 'webhook' | 'manual';
export type ResultStatus = 'TP1' | 'TP2' | 'TP3' | 'STOP' | 'MANUAL' | '3X';
export type TelegramTipo = 'entrada' | 'saida' | 'scalp_realize' | 'scalp_stop';
export type TelegramStatus = 'sent' | 'error';

export interface Alert {
  id: string;
  created_at: string;
  ativo: string;
  timeframe: string;
  indicador: string;
  direcao: DirecaoType;
  preco_entrada: number | null;
  stop: number | null;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  confianca_nota: ConfiancaNota | null;
  confianca_score: number | null;
  mercado_nota: MercadoNota | null;
  veredito: string | null;
  via_entrada: string | null;
  origem: Origem;
  webhook_raw: Record<string, unknown> | null;
}

export interface AlertWithResult extends Alert {
  result: Result | null;
}

export interface Result {
  id: string;
  alert_id: string;
  created_at: string;
  preco_saida: number;
  data_saida: string;
  duracao_minutos: number | null;
  resultado_pct: number | null;
  resultado_marg: number | null;
  status: ResultStatus;
  observacao: string | null;
  telegram_sent: boolean;
}

export interface ResultWithAlert extends Result {
  alerts: Alert;
}

export interface TelegramLog {
  id: string;
  created_at: string;
  alert_id: string;
  tipo: TelegramTipo;
  status: TelegramStatus;
  error_msg: string | null;
}

export interface ThreeXOperation {
  id: string;
  created_at: string;
  alert_id: string | null;
  ativo: string;
  data_operacao: string;
  entrada_original: number;
  entrada_3x: number;
  saida: number;
  resultado_pct: number | null;
  resultado_marg: number | null;
  observacao: string | null;
}

export interface DashboardStats {
  total_alertas: number;
  com_resultado: number;
  ganhos: number;
  stops: number;
  win_rate: number;
  pnl_total_marg: number;
  melhor_ativo: string;
  alertas_hoje: number;
  tres_x_count: number;
}

export interface WebhookPayload {
  secret: string;
  ativo: string;
  timeframe: string;
  indicador: string;
  direcao: DirecaoType;
  via_entrada?: string;
  preco_entrada?: string;
  stop?: string;
  tp1?: string;
  tp2?: string;
  tp3?: string;
  confianca_nota?: string;
  confianca_score?: string;
  mercado_nota?: string;
  veredito?: string;
}

export interface ResultPayload {
  alert_id: string;
  preco_saida: number;
  data_saida: string;
  status: ResultStatus;
  observacao?: string;
}

export interface ThreeXPayload {
  alert_id?: string;
  ativo: string;
  data_operacao: string;
  entrada_original: number;
  entrada_3x: number;
  saida: number;
  observacao?: string;
}

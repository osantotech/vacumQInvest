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
/**
 * FIBO/FORÇA vêm do Modo Grécia v1.5; ED/PBv/PPB-ec vêm do VQ Pullback v1.8.
 * O campo é gravado como texto livre — este tipo documenta o que chega hoje,
 * não restringe o que a API aceita.
 */
export type ViaEntrada = 'FIBO' | 'FORÇA' | 'ED' | 'PBv' | 'PPB-ec' | null;
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
  /**
   * Correlação com o BTC nas últimas N velas (-1 a 1), medida pelo indicador.
   * NULL no próprio BTC ou quando a medição está desligada.
   */
  correlacao_btc: number | null;
  /**
   * Drone — direção da PST no timeframe maior no instante do sinal.
   *
   * O método (Bruno Aguiar) usa o gráfico de 2h para confirmar a tendência e o
   * de 30m para executar. O sinal contra o drone NÃO é bloqueado: ele chega
   * marcado, porque bloquear apagaria a metade do dado que permite comparar,
   * mais adiante, se operar a favor de fato performa melhor.
   */
  tendencia_htf: TendenciaHtf | null;
  /** Timeframe consultado como drone — "120" para 2h. */
  htf_timeframe: string | null;
  /** true = a favor, false = contra, null = indefinido. null ≠ false. */
  alinhado_htf: boolean | null;
  /** Snapshot do painel do indicador no instante do sinal. */
  painel: PainelSnapshot | null;
  /** Observação escrita pelo trader — a parte do diário que não se automatiza. */
  anotacao: string | null;
  origem: Origem;
  webhook_raw: Record<string, unknown> | null;
}

/** A partir daqui o sinal deixa de ser independente: é o BTC com outro nome. */
export const CORRELACAO_BTC_ALTA = 0.85;

export type TendenciaHtf = 'LONG' | 'SHORT' | 'INDEFINIDO';

/**
 * O que o painel do indicador mostrava no instante do sinal.
 *
 * Guardamos os valores semânticos ("SEGURE"), não o texto da tela
 * ("SEGURE ✓") — o rótulo muda com o layout, o significado não.
 */
export interface PainelSnapshot {
  fase: string | null;
  baliz: string | null;
  estrutura: string | null;
  ote: string | null;
  /** "A_FAVOR" | "CONTRA" | "INDEFINIDO" — o que o gráfico maior dizia. */
  drone: string | null;
  /** Timeframe do drone naquele sinal, caso ele mude com o tempo. */
  drone_tf: string | null;
  sessoes: string | null;
  spread_pct: number | null;
  roe_pct: number | null;
  sma200_pct: number | null;
  stop_ama_pct: number | null;
  stop_pst_pct: number | null;
  impulso_dir: number | null;
}

export interface AlertWithResult extends Alert {
  result: Result | null;
}

/**
 * Espelha as colunas que a tabela `results` realmente tem no Supabase.
 * `created_at` e `observacao` foram declaradas aqui um dia, mas não existem
 * no banco — pedi-las no select derrubava a query inteira (42703).
 */
export interface Result {
  id: string;
  alert_id: string;
  preco_saida: number;
  data_saida: string;
  duracao_minutos: number | null;
  resultado_pct: number | null;
  resultado_marg: number | null;
  status: ResultStatus;
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
  /** null quando nenhuma operação fechou: não existe taxa de acerto sem amostra. */
  win_rate: number | null;
  pnl_total_marg: number;
  melhor_ativo: string;
  alertas_hoje: number;
  tres_x_count: number;
}

export interface WebhookPayload {
  secret: string;
  tipo?: 'entrada' | 'saida';
  ativo: string;
  timeframe?: string;
  indicador?: string;
  direcao?: DirecaoType;
  via_entrada?: string;
  preco_entrada?: string;
  preco_saida?: string;
  status?: ResultStatus;
  stop?: string;
  tp1?: string;
  tp2?: string;
  tp3?: string;
  confianca_nota?: string;
  confianca_score?: string;
  mercado_nota?: string;
  veredito?: string;
  correlacao_btc?: string;
  tendencia_htf?: string;
  htf_timeframe?: string;
  /** Booleano JSON de verdade — o Pine monta sem aspas. */
  alinhado_htf?: boolean | null;
  painel?: PainelSnapshot;
}

export interface ResultPayload {
  alert_id: string;
  preco_saida: number;
  data_saida: string;
  status: ResultStatus;
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

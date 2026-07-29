-- ============================================================
-- VacumQInvest — Supabase Schema
-- Paste this entire script into the Supabase SQL Editor and run.
-- ============================================================

-- 1. Approved emails (access control)
CREATE TABLE IF NOT EXISTS approved_emails (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert your admin email first (change this!)
-- INSERT INTO approved_emails (email) VALUES ('your-email@gmail.com');

-- 2. Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),

  -- identification
  ativo           text NOT NULL,
  timeframe       text NOT NULL,
  indicador       text NOT NULL,
  direcao         text NOT NULL,

  -- prices (nullable for alerts without prices, e.g. exaustão)
  preco_entrada   numeric(20,8),
  stop            numeric(20,8),
  tp1             numeric(20,8),
  tp2             numeric(20,8),
  tp3             numeric(20,8),

  -- quality indexes (Entrada e Saída)
  confianca_nota  text,
  confianca_score integer,
  mercado_nota    text,
  veredito        text,

  -- confirmation (VacumQ Grécia)
  via_entrada     text,

  -- origin
  origem          text DEFAULT 'webhook',
  webhook_raw     jsonb
);

-- 3. Results table
CREATE TABLE IF NOT EXISTS results (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id        uuid REFERENCES alerts(id) ON DELETE CASCADE,
  created_at      timestamptz DEFAULT now(),

  preco_saida     numeric(20,8) NOT NULL,
  data_saida      timestamptz NOT NULL,
  duracao_minutos integer,

  resultado_pct   numeric(10,4),
  resultado_marg  numeric(10,4),

  status          text NOT NULL,
  observacao      text,

  telegram_sent   boolean DEFAULT false
);

-- 4. Telegram log
CREATE TABLE IF NOT EXISTS telegram_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  alert_id   uuid REFERENCES alerts(id),
  tipo       text,
  status     text,
  error_msg  text
);

-- 5. Three-X recovery operations
CREATE TABLE IF NOT EXISTS three_x_operations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz DEFAULT now(),
  alert_id          uuid REFERENCES alerts(id) ON DELETE SET NULL,

  ativo             text NOT NULL,
  data_operacao     timestamptz NOT NULL,
  entrada_original  numeric(20,8) NOT NULL,
  entrada_3x        numeric(20,8) NOT NULL,
  saida             numeric(20,8) NOT NULL,
  resultado_pct     numeric(10,4),
  resultado_marg    numeric(10,4),
  observacao        text
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_ativo ON alerts(ativo);
CREATE INDEX idx_alerts_indicador ON alerts(indicador);
CREATE INDEX idx_alerts_direcao ON alerts(direcao);
CREATE INDEX idx_results_alert_id ON results(alert_id);
CREATE INDEX idx_results_data_saida ON results(data_saida DESC);
CREATE INDEX idx_telegram_log_alert_id ON telegram_log(alert_id);
CREATE INDEX idx_three_x_created_at ON three_x_operations(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE three_x_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_emails ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user's email is approved
CREATE OR REPLACE FUNCTION is_approved_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM approved_emails
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
$$;

-- Alerts: authenticated + approved can read
CREATE POLICY "Approved users can read alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (is_approved_user());

-- Alerts: service role inserts via webhook (no RLS needed for service role)
-- For manual inserts by authenticated users:
CREATE POLICY "Approved users can insert alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (is_approved_user());

-- Results: authenticated + approved can read and insert
CREATE POLICY "Approved users can read results"
  ON results FOR SELECT
  TO authenticated
  USING (is_approved_user());

CREATE POLICY "Approved users can insert results"
  ON results FOR INSERT
  TO authenticated
  WITH CHECK (is_approved_user());

CREATE POLICY "Approved users can update results"
  ON results FOR UPDATE
  TO authenticated
  USING (is_approved_user());

-- Telegram log: read-only for approved users
CREATE POLICY "Approved users can read telegram_log"
  ON telegram_log FOR SELECT
  TO authenticated
  USING (is_approved_user());

-- Three-X: approved users can read and insert
CREATE POLICY "Approved users can read three_x_operations"
  ON three_x_operations FOR SELECT
  TO authenticated
  USING (is_approved_user());

CREATE POLICY "Approved users can insert three_x_operations"
  ON three_x_operations FOR INSERT
  TO authenticated
  WITH CHECK (is_approved_user());

CREATE POLICY "Approved users can update three_x_operations"
  ON three_x_operations FOR UPDATE
  TO authenticated
  USING (is_approved_user());

-- Approved emails: only readable by approved users (admin manages via dashboard)
CREATE POLICY "Approved users can read approved_emails"
  ON approved_emails FOR SELECT
  TO authenticated
  USING (is_approved_user());

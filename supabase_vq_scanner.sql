-- Schema para o Módulo VQ Scanner

-- Tabela para gerenciar quais criptos o scanner vai monitorar
CREATE TABLE IF NOT EXISTS scanner_watchlist (
  symbol  TEXT PRIMARY KEY,              -- ex: BTCUSDT
  ativo   BOOLEAN DEFAULT TRUE,
  ordem   INT
);

-- Tabela para armazenar os alertas/sinais detectados pelo Scanner
CREATE TABLE IF NOT EXISTS scanner_signals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  ativo         TEXT NOT NULL,           -- ex: BTCUSDT
  timeframe     TEXT NOT NULL,           -- 15m, 30m, 2h, 4h
  fase          TEXT NOT NULL,           -- PST_FLIP, PB_START, PBv, PPB_EC
  direcao       TEXT NOT NULL,           -- LONG, SHORT
  brk_price     NUMERIC,                 -- preço do rompimento
  close_atual   NUMERIC,                 -- close do candle atual
  sma8          NUMERIC,
  sma21         NUMERIC,
  sma200        NUMERIC,
  fib_382       NUMERIC,
  fib_618       NUMERIC,
  score_pbv     INT,                     -- 0-5 (quantos fatores bateram)
  fatores       JSONB,                   -- detalhes dos 5 fatores (ex: {"vol_5x": true, "vol_caindo": false})
  telegram_sent BOOLEAN DEFAULT FALSE
);

-- Políticas de RLS
ALTER TABLE scanner_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE scanner_signals ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários autenticados leiam e escrevam
CREATE POLICY "Enable read access for all authenticated users on scanner_watchlist" ON scanner_watchlist FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users on scanner_watchlist" ON scanner_watchlist FOR ALL TO authenticated USING (true);

CREATE POLICY "Enable read access for all authenticated users on scanner_signals" ON scanner_signals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for service_role on scanner_signals" ON scanner_signals FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Enable update for service_role on scanner_signals" ON scanner_signals FOR UPDATE TO service_role USING (true);

-- Popular Watchlist com as Top 15 (para começar, você pode adicionar mais pela interface depois)
INSERT INTO scanner_watchlist (symbol, ativo, ordem) VALUES
('BTCUSDT', true, 1),
('ETHUSDT', true, 2),
('SOLUSDT', true, 3),
('BNBUSDT', true, 4),
('XRPUSDT', true, 5),
('DOGEUSDT', true, 6),
('ADAUSDT', true, 7),
('AVAXUSDT', true, 8),
('LINKUSDT', true, 9),
('MATICUSDT', true, 10),
('DOTUSDT', true, 11),
('LTCUSDT', true, 12),
('BCHUSDT', true, 13),
('TRXUSDT', true, 14),
('UNIUSDT', true, 15)
ON CONFLICT (symbol) DO NOTHING;

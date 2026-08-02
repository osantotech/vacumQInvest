-- ============================================================
-- Migração 002 — correlação com o BTC na tabela alerts
-- ============================================================
-- Mede o quanto o ativo do sinal está andando junto com o BTC nas últimas N
-- velas (correlação de Pearson dos retornos, calculada no Pine com
-- ta.correlation e enviada pelo webhook).
--
-- Faixa: -1 a 1.
--   >= 0.85  o ativo é BTC disfarçado — o sinal não é independente
--   0.5-0.85 acompanha parcialmente
--   < 0.5    movimento próprio
--   < 0      anda ao contrário do BTC
--
-- PARA QUE SERVE: cinco sinais em alts com correlação 0,9 não são cinco
-- operações — são uma aposta no BTC com cinco vezes o tamanho. Se o BTC virar,
-- as cinco morrem no mesmo minuto. A coluna existe para tornar essa
-- concentração visível ANTES de abrir a quinta posição.
--
-- Rode este arquivo no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS correlacao_btc numeric(6,4);

COMMENT ON COLUMN alerts.correlacao_btc IS
  'Correlação de Pearson com BTCUSDT.P nas últimas N velas (-1 a 1). NULL quando o ativo é o próprio BTC ou a medição está desligada no indicador.';

-- Índice parcial: as consultas interessantes são sempre "quais sinais estão
-- colados no BTC", nunca a coluna inteira.
CREATE INDEX IF NOT EXISTS idx_alerts_correlacao_alta
  ON alerts (correlacao_btc DESC)
  WHERE correlacao_btc IS NOT NULL;

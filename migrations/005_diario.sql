-- ============================================================
-- Migração 005 — diário de operações
-- ============================================================
-- Duas colunas em `alerts`, e nenhuma tabela nova.
--
-- A proposta original criava uma tabela `diary_events` com o snapshot do
-- painel. Seriam duas fontes de verdade para o mesmo evento: o webhook
-- gravaria nas duas, e bastaria uma falha parcial para elas divergirem — sem
-- ninguém saber qual está certa. O alerta JÁ É o evento; o que faltava era
-- guardar o contexto que o painel mostrava naquele instante.
--
-- Rode este arquivo no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS painel jsonb,
  ADD COLUMN IF NOT EXISTS anotacao text;

COMMENT ON COLUMN alerts.painel IS
  'Snapshot do painel do indicador no momento do sinal: fase, balizador, estrutura, OTE, sessões abertas, spread/ROE e distâncias até SMA200, média amarela e PST.';

COMMENT ON COLUMN alerts.anotacao IS
  'Observação escrita pelo trader. É a parte do diário que a automação não faz: o que ele viu, o que sentiu e o que aprendeu.';

-- O diário é sempre consultado por ativo e em ordem cronológica.
CREATE INDEX IF NOT EXISTS idx_alerts_ativo_data
  ON alerts (ativo, created_at DESC);

-- 006 — Drone: tendencia do timeframe maior no momento do sinal
--
-- Metodo Bruno Aguiar: o grafico de 2h confirma a tendencia (olhar de drone),
-- o de 30m executa. Ate aqui o indicador rodava em 30m sem saber o que 2h
-- estava fazendo — disparava com a mesma conviccao a favor ou contra.
--
-- DECISAO: o sinal contra o drone NAO e bloqueado, e gravado MARCADO. Sem o
-- registro dos dois casos nao ha como comparar o desempenho depois.

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS tendencia_htf text;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS htf_timeframe text;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS alinhado_htf boolean;

COMMENT ON COLUMN alerts.tendencia_htf IS 'Direcao da PST no timeframe maior: LONG, SHORT ou INDEFINIDO';
COMMENT ON COLUMN alerts.htf_timeframe IS 'Timeframe consultado como drone (ex: 120 = 2h)';
COMMENT ON COLUMN alerts.alinhado_htf IS 'true = a favor do drone, false = contra, NULL = indefinido (nao sei != esta contra)';

-- Indice parcial: a consulta que interessa e "quais foram contra".
CREATE INDEX IF NOT EXISTS idx_alerts_contra_drone
  ON alerts (created_at DESC)
  WHERE alinhado_htf IS FALSE;

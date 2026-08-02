-- ============================================================
-- Migração 003 — trilha de auditoria: aceite de termos e avisos exibidos
-- ============================================================
-- Objetivo: poder demonstrar, depois, que o usuário aceitou o termo vigente e
-- que os avisos de risco estavam na tela quando ele decidiu operar.
--
-- Duas peças com pesos diferentes:
--   termos_aceite    -> ATO consciente (ele clicou aceitando). Prova forte.
--   avisos_exibidos  -> telemetria (o aviso foi renderizado). Prova de apoio:
--                       mostra padrão, não substitui o aceite.
--
-- Rode este arquivo no SQL Editor do Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Aceite de termos
-- ------------------------------------------------------------
-- Uma linha por (usuário, versão). Guardar o HASH do texto é o que impede a
-- discussão futura de "o termo que eu aceitei era outro": o conteúdo exato
-- fica provado sem precisar duplicar o texto em cada linha.
CREATE TABLE IF NOT EXISTS termos_aceite (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),

  user_id        uuid NOT NULL,
  email          text,

  versao         text NOT NULL,
  hash_conteudo  text NOT NULL,

  ip             text,
  user_agent     text,

  UNIQUE (user_id, versao)
);

CREATE INDEX IF NOT EXISTS idx_termos_user ON termos_aceite (user_id, created_at DESC);

-- ------------------------------------------------------------
-- 2. Avisos de risco exibidos
-- ------------------------------------------------------------
-- Uma linha por (usuário, ativo, tipo, dia), com contador de repetições.
-- Registrar cada renderização geraria centenas de linhas idênticas por dia — a
-- cada F5 — sem acrescentar nada: o que importa é "neste dia, este usuário viu
-- este aviso sobre este ativo", e quantas vezes.
CREATE TABLE IF NOT EXISTS avisos_exibidos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  ultima_vez     timestamptz NOT NULL DEFAULT now(),
  vezes          integer NOT NULL DEFAULT 1,

  user_id        uuid NOT NULL,
  email          text,

  dia            date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')::date,
  ativo          text,
  tipo           text NOT NULL,
  gravidade      text NOT NULL,

  -- Texto exato que estava na tela. Guardado por extenso de propósito: se a
  -- redação do aviso mudar no futuro, o histórico precisa preservar o que o
  -- usuário realmente leu, não o que o código diz hoje.
  titulo         text NOT NULL,
  detalhe        text,
  alavancagem    numeric(6,2),

  UNIQUE (user_id, dia, ativo, tipo)
);

CREATE INDEX IF NOT EXISTS idx_avisos_user_dia ON avisos_exibidos (user_id, dia DESC);
CREATE INDEX IF NOT EXISTS idx_avisos_ativo ON avisos_exibidos (ativo, dia DESC);

-- ------------------------------------------------------------
-- 3. Row Level Security
-- ------------------------------------------------------------
-- Trilha de auditoria não pode ser escrita nem apagada pelo próprio auditado:
-- a gravação passa sempre pelas rotas de API, que usam a service role. Para o
-- usuário autenticado, o acesso é SOMENTE LEITURA e só das próprias linhas
-- (direito de acesso previsto na LGPD).
--
-- Não há policy de UPDATE nem de DELETE para `authenticated` — de propósito.
ALTER TABLE termos_aceite ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos_exibidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario le o proprio aceite" ON termos_aceite;
CREATE POLICY "Usuario le o proprio aceite"
  ON termos_aceite FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuario le os proprios avisos" ON avisos_exibidos;
CREATE POLICY "Usuario le os proprios avisos"
  ON avisos_exibidos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE termos_aceite IS
  'Aceite explícito do termo de uso. Uma linha por usuário e versão. Escrita apenas pela service role.';
COMMENT ON TABLE avisos_exibidos IS
  'Avisos de risco renderizados na tela. Agregado por usuário/ativo/tipo/dia com contador. Escrita apenas pela service role.';

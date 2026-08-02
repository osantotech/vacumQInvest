-- ============================================================
-- Migração 004 — quem pode gerenciar os acessos
-- ============================================================
-- A tela de Configurações passa a criar contas e revogar acessos. Sem esta
-- coluna, qualquer pessoa da equipe poderia adicionar gente, revogar o acesso
-- dos colegas e até derrubar o dono da própria plataforma.
--
-- Rode este arquivo no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE approved_emails
  ADD COLUMN IF NOT EXISTS admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN approved_emails.admin IS
  'Pode gerenciar acessos (criar contas, revogar). Verificado no servidor, nunca no cliente.';

-- O dono vira admin. Se o e-mail mudar, ajuste aqui antes de rodar — do
-- contrário ninguém consegue administrar a plataforma pela interface.
UPDATE approved_emails
   SET admin = true
 WHERE email = 'dreamersglobal@gmail.com';

-- Trava de segurança no banco, não só na aplicação: sem pelo menos um admin,
-- a tela de gerenciamento fica inacessível para todos e só o SQL Editor
-- resolveria. O índice parcial deixa a checagem barata.
CREATE INDEX IF NOT EXISTS idx_approved_admin
  ON approved_emails (email)
  WHERE admin = true;

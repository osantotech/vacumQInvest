'use client';

import { useCallback, useEffect, useState } from 'react';
import './GerenciarAcessos.css';

interface Acesso {
  id: string;
  email: string;
  admin: boolean;
  created_at: string;
  tem_conta: boolean;
  ultimo_login: string | null;
  aceitou_termo: string | null;
  versao_termo: string | null;
}

function dataBR(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Gerência de quem entra na plataforma.
 *
 * O componente some por completo para quem não é admin — mas quem garante o
 * controle é a rota, que checa a permissão no servidor. Esconder botão é
 * arrumação de tela, não segurança.
 */
export default function GerenciarAcessos() {
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [adminAtual, setAdminAtual] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [permitido, setPermitido] = useState(false);

  const [novoEmail, setNovoEmail] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [credencial, setCredencial] = useState<{ email: string; senha: string } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/acessos');
      if (res.status === 403) {
        setPermitido(false);
        return;
      }
      if (!res.ok) throw new Error('Falha ao carregar a lista');
      const json = await res.json();
      setAcessos(json.acessos ?? []);
      setAdminAtual(json.admin_atual ?? null);
      setPermitido(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function adicionar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    setCredencial(null);
    try {
      const res = await fetch('/api/acessos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: novoEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details ?? json.error ?? 'Falha ao adicionar');

      if (json.senha_provisoria) {
        setCredencial({ email: json.email, senha: json.senha_provisoria });
      }
      setNovoEmail('');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  }

  async function revogar(email: string) {
    if (!confirm(`Revogar o acesso de ${email}?\n\nA pessoa deixa de conseguir entrar. O histórico de aceite do termo é preservado.`)) return;
    setErro(null);
    try {
      const res = await fetch(`/api/acessos?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Falha ao revogar');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    }
  }

  if (carregando) return null;
  if (!permitido) return null;

  return (
    <div className="ga-wrap">
      <div className="ga-cabecalho">
        <h2>Quem tem acesso</h2>
        <span className="ga-contagem">{acessos.length}</span>
      </div>

      <form className="ga-form" onSubmit={adicionar}>
        <input
          type="email"
          className="ga-input"
          placeholder="email@daequipe.com"
          value={novoEmail}
          onChange={e => setNovoEmail(e.target.value)}
          required
        />
        <button type="submit" className="ga-botao" disabled={salvando || !novoEmail}>
          {salvando ? 'Criando…' : 'Liberar acesso'}
        </button>
      </form>

      {credencial && (
        <div className="ga-credencial">
          <strong>Conta criada. Repasse estes dados:</strong>
          <div className="ga-cred-linha"><span>E-mail</span><code>{credencial.email}</code></div>
          <div className="ga-cred-linha"><span>Senha</span><code>{credencial.senha}</code></div>
          <p>
            Esta senha aparece <strong>uma única vez</strong> — não fica guardada
            em lugar nenhum. Se perder, revogue o acesso e libere de novo.
          </p>
        </div>
      )}

      {erro && <div className="ga-erro">{erro}</div>}

      <div className="ga-tabela-wrap">
        <table className="ga-tabela">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Conta</th>
              <th>Último acesso</th>
              <th>Aceitou o termo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {acessos.map(a => (
              <tr key={a.id}>
                <td>
                  <span className="ga-email">{a.email}</span>
                  {a.admin && <span className="ga-tag-admin">admin</span>}
                  {a.email === adminAtual && <span className="ga-tag-voce">você</span>}
                </td>
                <td>
                  {a.tem_conta
                    ? <span className="ga-ok">criada</span>
                    : <span className="ga-pendente">sem conta</span>}
                </td>
                <td className="ga-data">{a.ultimo_login ? dataBR(a.ultimo_login) : 'nunca entrou'}</td>
                <td className="ga-data">
                  {a.aceitou_termo
                    ? <>{dataBR(a.aceitou_termo)} <span className="ga-versao">v{a.versao_termo}</span></>
                    : <span className="ga-pendente">pendente</span>}
                </td>
                <td className="ga-acao">
                  {a.email !== adminAtual && (
                    <button type="button" className="ga-revogar" onClick={() => revogar(a.email)}>
                      revogar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="ga-nota">
        Liberar acesso cria a conta e autoriza o e-mail nos dois lugares — sem as
        duas coisas, a pessoa não entra. Revogar apenas retira a autorização: a
        conta e o registro de aceite do termo permanecem, porque é esse histórico
        que precisa sobreviver a uma saída.
      </p>
    </div>
  );
}

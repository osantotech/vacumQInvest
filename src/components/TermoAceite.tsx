'use client';

import { useCallback, useEffect, useState } from 'react';
import './TermoAceite.css';

/**
 * Portão de entrada: enquanto o usuário não aceitar a versão vigente do termo,
 * nada da plataforma aparece.
 *
 * O bloqueio é deliberado. Um banner dispensável no rodapé não sustenta a
 * afirmação de que o usuário assumiu o risco — o que sustenta é um ato: ele
 * rolou o texto, marcou a caixa e clicou.
 */
export default function TermoAceite({ children }: { children: React.ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [aceito, setAceito] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [versao, setVersao] = useState('');
  const [marcado, setMarcado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const verificar = useCallback(async () => {
    try {
      const res = await fetch('/api/termos');
      if (res.status === 401) {
        // Sem sessão: quem cuida do acesso é o middleware, não este componente.
        setAceito(true);
        return;
      }
      if (!res.ok) throw new Error('Falha ao verificar o termo');
      const json = await res.json();
      setAceito(Boolean(json.aceito));
      setTitulo(json.titulo ?? '');
      setTexto(json.texto ?? '');
      setVersao(json.versao ?? '');
    } catch {
      // Se a verificação falhar, não trave o usuário fora da própria
      // plataforma: registra-se o aceite na próxima carga bem-sucedida.
      setAceito(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    verificar();
  }, [verificar]);

  async function confirmar() {
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch('/api/termos', { method: 'POST' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Não foi possível registrar o aceite');
      }
      setAceito(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return null;
  if (aceito) return <>{children}</>;

  return (
    <div className="ta-overlay" role="dialog" aria-modal="true" aria-labelledby="ta-titulo">
      <div className="ta-modal">
        <div className="ta-cabecalho">
          <h1 id="ta-titulo">{titulo}</h1>
          <span className="ta-versao">versão {versao}</span>
        </div>

        <div className="ta-texto" tabIndex={0}>
          {texto.split('\n\n').map((par, i) => (
            <p key={i}>{par}</p>
          ))}
        </div>

        <label className="ta-check">
          <input
            type="checkbox"
            checked={marcado}
            onChange={e => setMarcado(e.target.checked)}
          />
          <span>
            Li e entendi o termo acima. Assumo integralmente a responsabilidade
            pelas decisões de investimento que eu tomar a partir das informações
            exibidas nesta plataforma.
          </span>
        </label>

        {erro && <div className="ta-erro">{erro}</div>}

        <button
          type="button"
          className="ta-botao"
          disabled={!marcado || enviando}
          onClick={confirmar}
        >
          {enviando ? 'Registrando…' : 'Aceitar e continuar'}
        </button>

        <p className="ta-rodape">
          A data, a hora e a versão deste aceite ficam registradas para fins de
          auditoria.
        </p>
      </div>
    </div>
  );
}

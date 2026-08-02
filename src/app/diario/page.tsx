'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDateTimeFullBR, formatDurationBetween } from '@/lib/calculations';
import type { PainelSnapshot } from '@/lib/types';
import './diario.css';

interface ResultadoDiario {
  preco_saida: number;
  data_saida: string;
  duracao_minutos: number | null;
  resultado_pct: number | null;
  status: string;
}

interface EntradaDiario {
  id: string;
  created_at: string;
  ativo: string;
  timeframe: string;
  direcao: string;
  via_entrada: string | null;
  preco_entrada: number | null;
  stop: number | null;
  tp1: number | null;
  tp2: number | null;
  confianca_nota: string | null;
  confianca_score: number | null;
  mercado_nota: string | null;
  veredito: string | null;
  correlacao_btc: number | null;
  painel: PainelSnapshot | null;
  anotacao: string | null;
  results: ResultadoDiario[] | ResultadoDiario | null;
}

// ============================================================
// Helpers
// ============================================================
function num(v: number | null | undefined, casas = 2, sufixo = ''): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  return `${v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}${sufixo}`;
}

function preco(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  const casas = abs >= 10 ? 2 : abs >= 1 ? 4 : 6;
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: casas });
}

/** Traduz o valor semântico do painel para o rótulo que o trader lê. */
const ROTULOS: Record<string, string> = {
  ED: 'ED — entrada direta',
  PBv: 'PBv — virada (agressiva)',
  'PPB-ec': 'PPB-ec — confirmada',
  PULLBACK: 'Pullback — espere a volta',
  ROMPEU: 'Rompeu — aguarde',
  NENHUMA: '—',
  SEGURE: 'SEGURE',
  ATENCAO: 'ATENÇÃO',
  ENFRAQUECENDO: 'ENFRAQUECENDO',
  FORA: 'fora de posição',
  OK: 'topos/fundos OK',
  TOPO_MENOR: 'TOPO MENOR — avaliar saída',
  FUNDO_MAIOR: 'FUNDO MAIOR — avaliar saída',
  MORTA_0786: '0.786 rompida — setup morto',
  REJEICAO: 'rejeição confirmada',
  NA_ZONA: 'na zona — aguarde rejeição',
  IMPULSO_ALTA_FORA: 'impulso de alta — fora',
  IMPULSO_BAIXA_FORA: 'impulso de baixa — fora',
  INDEFINIDO: 'indefinido',
};

function rotulo(v: string | null | undefined): string {
  if (!v) return '—';
  return ROTULOS[v] ?? v;
}

/** Classe de cor por gravidade do estado do painel. */
function tomBaliz(v: string | null | undefined): string {
  if (v === 'SEGURE') return 'di-verde';
  if (v === 'ENFRAQUECENDO') return 'di-vermelho';
  if (v === 'ATENCAO') return 'di-amarelo';
  return '';
}

function tomEstrutura(v: string | null | undefined): string {
  if (v === 'OK') return 'di-verde';
  if (v === 'TOPO_MENOR' || v === 'FUNDO_MAIOR') return 'di-laranja';
  return '';
}

function tomOte(v: string | null | undefined): string {
  if (v === 'REJEICAO') return 'di-verde';
  if (v === 'MORTA_0786') return 'di-vermelho';
  if (v === 'NA_ZONA') return 'di-azul';
  return '';
}

function primeiroResultado(r: EntradaDiario['results']): ResultadoDiario | null {
  if (!r) return null;
  return Array.isArray(r) ? (r[0] ?? null) : r;
}

// ============================================================
// Componente
// ============================================================
export default function Diario() {
  const [entradas, setEntradas] = useState<EntradaDiario[]>([]);
  const [ativos, setAtivos] = useState<string[]>([]);
  const [filtro, setFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const url = filtro ? `/api/diario?ativo=${encodeURIComponent(filtro)}` : '/api/diario';
      const res = await fetch(url);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.details ?? j.error ?? 'Falha ao carregar o diário');
      }
      const json = await res.json();
      setEntradas(json.data ?? []);
      setAtivos(json.ativos ?? []);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  }, [filtro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvarAnotacao(id: string) {
    setSalvando(true);
    try {
      const res = await fetch('/api/diario', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, anotacao: rascunho }),
      });
      if (!res.ok) throw new Error('Não foi possível salvar');
      setEntradas(prev => prev.map(e => (e.id === id ? { ...e, anotacao: rascunho.trim() || null } : e)));
      setEditando(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '16px' }}>
        <h1 className="di-titulo">DIÁRIO DE OPERAÇÕES</h1>
        <p className="di-sub">
          Cada sinal com o que o painel mostrava naquele instante. O registro é
          automático; a anotação é sua — é ela que transforma histórico em
          calibração.
        </p>
      </div>

      {/* Filtro por ativo */}
      <div className="di-filtros">
        <button className={filtro === '' ? 'ativo' : ''} onClick={() => setFiltro('')}>
          Todos
        </button>
        {ativos.map(a => (
          <button key={a} className={filtro === a ? 'ativo' : ''} onClick={() => setFiltro(a)}>
            {a}
          </button>
        ))}
      </div>

      {erro && <div className="di-erro">{erro}</div>}

      {carregando ? (
        <div className="di-vazio">Carregando…</div>
      ) : entradas.length === 0 ? (
        <div className="di-vazio">
          {filtro
            ? `Nenhum sinal registrado para ${filtro}`
            : 'Nenhum sinal registrado ainda. Assim que o indicador disparar, ele aparece aqui.'}
        </div>
      ) : (
        <div className="di-timeline">
          {entradas.map(e => {
            const r = primeiroResultado(e.results);
            const long = e.direcao === 'LONG' || e.direcao === 'SCALP_LONG';
            const p = e.painel;

            return (
              <article key={e.id} className={`di-card ${r ? 'fechado' : 'aberto'}`}>
                {/* Cabeçalho */}
                <header className="di-card-topo">
                  <div className="di-id">
                    <span className={`di-seta ${long ? 'long' : 'short'}`}>{long ? '↑' : '↓'}</span>
                    <strong>{e.ativo}</strong>
                    <span className="di-tf">{e.timeframe}m</span>
                    <span className={`di-via ${e.via_entrada === 'PPB-ec' ? 'segura' : ''}`}>
                      {rotulo(p?.fase ?? e.via_entrada)}
                    </span>
                  </div>
                  <div className="di-quando">
                    {formatDateTimeFullBR(e.created_at)}
                    {r && <> · durou {formatDurationBetween(e.created_at, r.data_saida)}</>}
                  </div>
                </header>

                {/* Níveis */}
                <div className="di-linha">
                  <span><i>Entrada</i> {preco(e.preco_entrada)}</span>
                  <span><i>Stop</i> {preco(e.stop)}</span>
                  <span><i>Alvo 1</i> {preco(e.tp1)}</span>
                  <span><i>Alvo 2</i> {preco(e.tp2)}</span>
                  {e.confianca_score !== null && (
                    <span><i>Score</i> {e.confianca_score}/5</span>
                  )}
                  {e.correlacao_btc !== null && (
                    <span><i>BTC</i> {num(e.correlacao_btc * 100, 0, '%')}</span>
                  )}
                </div>

                {/* Painel do indicador no momento */}
                {p && (
                  <div className="di-painel">
                    <span><i>Balizador</i> <b className={tomBaliz(p.baliz)}>{rotulo(p.baliz)}</b></span>
                    <span><i>Estrutura</i> <b className={tomEstrutura(p.estrutura)}>{rotulo(p.estrutura)}</b></span>
                    <span><i>OTE</i> <b className={tomOte(p.ote)}>{rotulo(p.ote)}</b></span>
                    <span><i>SMA200</i> <b className={Math.abs(p.sma200_pct ?? 99) < 2 ? 'di-laranja' : ''}>{num(p.sma200_pct, 2, '%')}</b></span>
                    <span><i>Stop AMA</i> <b>{num(p.stop_ama_pct, 2, '%')}</b></span>
                    <span><i>Stop PST</i> <b>{num(p.stop_pst_pct, 2, '%')}</b></span>
                    <span><i>Sessões</i> <b>{p.sessoes ? p.sessoes.replace(/,$/, '').split(',').join(' · ') : 'todas fechadas'}</b></span>
                  </div>
                )}

                {/* Desfecho */}
                {r ? (
                  <div className={`di-desfecho ${(r.resultado_pct ?? 0) >= 0 ? 'ganho' : 'perda'}`}>
                    <strong>{r.status}</strong>
                    <span>saída {preco(r.preco_saida)}</span>
                    <span>{num(r.resultado_pct, 2, '%')}</span>
                  </div>
                ) : (
                  <div className="di-desfecho aberta"><strong>EM ABERTO</strong></div>
                )}

                {/* Anotação do trader */}
                <div className="di-nota">
                  {editando === e.id ? (
                    <>
                      <textarea
                        value={rascunho}
                        onChange={ev => setRascunho(ev.target.value)}
                        placeholder="O que você viu? Por que entrou ou deixou passar? O que faria diferente?"
                        rows={3}
                        autoFocus
                      />
                      <div className="di-nota-acoes">
                        <button onClick={() => salvarAnotacao(e.id)} disabled={salvando}>
                          {salvando ? 'Salvando…' : 'Salvar'}
                        </button>
                        <button className="secundario" onClick={() => setEditando(null)}>
                          Cancelar
                        </button>
                      </div>
                    </>
                  ) : e.anotacao ? (
                    <p onClick={() => { setEditando(e.id); setRascunho(e.anotacao ?? ''); }}>
                      {e.anotacao}
                    </p>
                  ) : (
                    <button
                      className="di-add-nota"
                      onClick={() => { setEditando(e.id); setRascunho(''); }}
                    >
                      + anotar
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

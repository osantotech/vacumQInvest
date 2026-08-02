'use client';

import { useEffect, useState } from 'react';
import { LEVERAGE } from '@/lib/calculations';
import { CORRELACAO_BTC_ALTA } from '@/lib/types';

export interface SinalAberto {
  ativo: string;
  direcao: string;
  preco_entrada: number | null;
  stop: number | null;
  tp1: number | null;
  correlacao_btc: number | null;
}

/**
 * ISOLADO: só a margem alocada sustenta a posição, e a liquidação ocorre a
 * 100/alavancagem por cento do preço de entrada.
 *
 * CRUZADO: o saldo inteiro da conta sustenta a posição, e a liquidação depende
 * de quanto saldo existe contra o tamanho aberto — números que a plataforma
 * não tem. Assumir os 100/alavancagem aqui produz alarme falso: medido numa
 * conta real, uma posição 20x cruzada liquidava a −74%, não a −5%.
 */
export type ModoMargem = 'isolado' | 'cruzado';

interface PainelRiscoProps {
  sinais: SinalAberto[];
  /** Alavancagem de referência para a conta de liquidação. */
  alavancagem?: number;
  /** Taxa de acerto histórica (%), para confrontar com o R:R exigido. */
  winRateHistorico?: number | null;
  /** Quantas operações sustentam esse win rate. */
  amostraHistorico?: number;
}

type Gravidade = 'critico' | 'atencao';

export interface Aviso {
  gravidade: Gravidade;
  tipo: 'stop_liquidacao' | 'stop_apertado' | 'correlacao_btc' | 'concentracao_btc' | 'risco_retorno';
  ativo: string | null;
  titulo: string;
  detalhe: string;
  /**
   * Consequência do cálculo, no indicativo — não no imperativo.
   *
   * "Use no máximo 14x" é recomendação de operação e enfraquece a posição da
   * plataforma como ferramenta de análise. "Este stop só caberia até 14x"
   * entrega a mesma informação acionável, mas quem decide é quem lê.
   */
  consequencia: string;
}

/**
 * Abaixo desta fração da distância de liquidação o stop ainda funciona, mas com
 * pouca folga — taxas e margem de manutenção comem o resto.
 */
const FOLGA_MINIMA = 0.8;

/**
 * Amostra mínima para confrontar o R:R exigido com o histórico real. Abaixo
 * disso o win rate é ruído: com 10 operações e 6 acertos, a taxa verdadeira
 * está em algum lugar entre 31% e 83%.
 */
const AMOSTRA_MINIMA = 30;

function pctRisco(s: SinalAberto): number | null {
  if (s.preco_entrada === null || s.stop === null || s.preco_entrada === 0) return null;
  return (Math.abs(s.preco_entrada - s.stop) / s.preco_entrada) * 100;
}

function pctGanho(s: SinalAberto): number | null {
  if (s.preco_entrada === null || s.tp1 === null || s.preco_entrada === 0) return null;
  const bruto = ((s.tp1 - s.preco_entrada) / s.preco_entrada) * 100;
  // No SHORT o alvo fica abaixo da entrada: o ganho é a distância, não o sinal.
  return s.direcao === 'SHORT' || s.direcao === 'SCALP_SHORT' ? -bruto : bruto;
}

/**
 * Taxa de acerto que zera a conta neste risco/retorno.
 *
 * De `WR × ganho = (1 − WR) × risco` sai `WR = risco / (risco + ganho)`.
 * É o número que decide se um setup se sustenta: arriscar 5% para ganhar 2,5%
 * exige 67% de acerto, e nenhum sinal técnico entrega isso de forma estável.
 */
function winRateNecessario(risco: number, ganho: number): number {
  return (risco / (risco + ganho)) * 100;
}

/**
 * Traduz os sinais abertos em avisos acionáveis.
 *
 * A regra que orienta tudo aqui: nenhum aviso termina num número. Saber que o
 * stop está a 6,76% não ajuda ninguém — saber que em 20x a corretora liquida
 * antes disso, e que o teto seguro é 14x, ajuda.
 */
export function montarAvisos(
  sinais: SinalAberto[],
  alavancagem: number,
  modo: ModoMargem = 'isolado',
  winRateHistorico: number | null = null,
  amostraHistorico: number = 0
): Aviso[] {
  const avisos: Aviso[] = [];
  const liquidacao = 100 / alavancagem;

  for (const s of sinais) {
    const risco = pctRisco(s);
    const ganho = pctGanho(s);

    // ── Risco/retorno: vale nos dois modos de margem ──
    // Um sinal pode estar tecnicamente perfeito e a operação perder dinheiro
    // por construção. Nenhuma outra tela olha para isto.
    if (risco !== null && ganho !== null && ganho > 0 && risco > 0) {
      const wrExigido = winRateNecessario(risco, ganho);
      const rr = ganho / risco;

      if (rr < 1) {
        const comparacao =
          winRateHistorico !== null && amostraHistorico >= AMOSTRA_MINIMA
            ? ` Seu histórico é de ${winRateHistorico.toFixed(1)}% em ${amostraHistorico} operações.`
            : '';
        avisos.push({
          gravidade: rr < 0.6 ? 'critico' : 'atencao',
          tipo: 'risco_retorno',
          ativo: s.ativo,
          titulo: `${s.ativo}: o alvo é menor que o risco`,
          detalhe: `Risco de ${risco.toFixed(2)}% para um alvo de ${ganho.toFixed(2)}% — relação de 1 para ${rr.toFixed(2)}.${comparacao}`,
          consequencia: `Nesta relação, seriam necessários ${wrExigido.toFixed(0)}% de acerto apenas para empatar.`,
        });
      }
    }

    if (risco === null) continue;

    // ── Distância até a liquidação: só faz sentido na margem isolada ──
    // No cruzado o saldo inteiro sustenta a posição, e a plataforma não conhece
    // esse saldo. Emitir o alerta aqui seria inventar um número.
    if (modo === 'cruzado') continue;

    if (risco >= liquidacao) {
      // O teto teórico ignora taxas e margem de manutenção, então a liquidação
      // real vem um pouco antes — daí arredondar para baixo.
      const levMax = Math.max(1, Math.floor(100 / risco));
      avisos.push({
        gravidade: 'critico',
        tipo: 'stop_liquidacao',
        ativo: s.ativo,
        titulo: `${s.ativo}: o stop está além do ponto de liquidação`,
        detalhe: `O stop está a ${risco.toFixed(2)}% da entrada, e em ${alavancagem}x a liquidação ocorre em ${liquidacao.toFixed(2)}%. O preço zera a margem antes de chegar ao stop.`,
        consequencia: `Este stop só caberia em alavancagem de até ${levMax}x.`,
      });
    } else if (risco >= liquidacao * FOLGA_MINIMA) {
      const usado = (risco / liquidacao) * 100;
      avisos.push({
        gravidade: 'atencao',
        tipo: 'stop_apertado',
        ativo: s.ativo,
        titulo: `${s.ativo}: stop próximo do ponto de liquidação`,
        detalhe: `O stop consome ${usado.toFixed(0)}% da distância até a liquidação em ${alavancagem}x, deixando pouca folga para taxas e oscilação.`,
        consequencia: `Com folga de 50%, a alavancagem equivalente seria de até ${Math.max(1, Math.floor(100 / risco / 1.5))}x.`,
      });
    }
  }

  // Concentração: propriedade do conjunto, não de cada linha.
  const colados = sinais.filter(
    s => s.correlacao_btc !== null && s.correlacao_btc >= CORRELACAO_BTC_ALTA
  );
  if (colados.length >= 2) {
    avisos.push({
      gravidade: 'critico',
      tipo: 'concentracao_btc',
      ativo: null,
      titulo: `${colados.length} posições abertas seguem o mesmo movimento`,
      detalhe: `${colados.map(s => s.ativo).join(', ')} estão com correlação acima de ${Math.round(CORRELACAO_BTC_ALTA * 100)}% com o BTC, ou seja, tendem a subir e cair juntas.`,
      consequencia: `Somadas, elas representam aproximadamente ${colados.length}x a exposição de uma única posição ao mesmo movimento.`,
    });
  } else if (colados.length === 1) {
    const s = colados[0];
    avisos.push({
      gravidade: 'atencao',
      tipo: 'correlacao_btc',
      ativo: s.ativo,
      titulo: `${s.ativo} está acompanhando o BTC`,
      detalhe: `Correlação de ${Math.round((s.correlacao_btc ?? 0) * 100)}% nas últimas velas: o movimento deste ativo tem acompanhado o do BTC.`,
      consequencia: `O comportamento do BTC tende a determinar o resultado desta posição.`,
    });
  }

  // Crítico primeiro: é o que muda a decisão agora.
  return avisos.sort((a, b) => (a.gravidade === b.gravidade ? 0 : a.gravidade === 'critico' ? -1 : 1));
}

const CHAVE_MODO = 'vq:modo-margem';

export default function PainelRisco({
  sinais,
  alavancagem = LEVERAGE,
  winRateHistorico = null,
  amostraHistorico = 0,
}: PainelRiscoProps) {
  const abertos = sinais.length;

  // Preferência local: é ajuste de leitura da própria tela, não dado de
  // negócio. Guardar no banco exigiria migration e rota para uma escolha que
  // vale por navegador.
  const [modo, setModo] = useState<ModoMargem>('isolado');

  useEffect(() => {
    const salvo = window.localStorage.getItem(CHAVE_MODO);
    if (salvo === 'isolado' || salvo === 'cruzado') setModo(salvo);
  }, []);

  function trocarModo(novo: ModoMargem) {
    setModo(novo);
    window.localStorage.setItem(CHAVE_MODO, novo);
  }

  const avisos = montarAvisos(sinais, alavancagem, modo, winRateHistorico, amostraHistorico);

  // Trilha de auditoria: registra o que de fato foi renderizado. A chave de
  // deduplicação inclui os títulos, então mudança de conteúdo gera novo envio,
  // mas um F5 no mesmo estado não repete a chamada.
  const assinatura = avisos.map(a => `${a.tipo}:${a.ativo}`).join('|');
  useEffect(() => {
    if (avisos.length === 0) return;
    fetch('/api/avisos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avisos: avisos.map(a => ({
          ativo: a.ativo,
          tipo: a.tipo,
          gravidade: a.gravidade,
          titulo: a.titulo,
          detalhe: `${a.detalhe} ${a.consequencia}`,
          alavancagem,
        })),
      }),
      // Falha aqui não pode quebrar a tela: a trilha é secundária ao uso.
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinatura, alavancagem]);

  if (abertos === 0) return null;

  return (
    <div className="pr-wrap">
      <div className="pr-header">
        <span className={`pr-icone ${avisos.length === 0 ? 'ok' : ''}`}>
          {avisos.length === 0 ? '✓' : '⚠'}
        </span>
        <div>
          <h2>
            {avisos.length === 0
              ? `${abertos} ${abertos === 1 ? 'sinal aberto' : 'sinais abertos'} — nenhum ajuste necessário`
              : `${avisos.length} ${avisos.length === 1 ? 'ponto exige' : 'pontos exigem'} sua atenção`}
          </h2>
          <p>
            Os sinais em <strong>ABERTO</strong> acima são entradas que o indicador
            marcou e que ainda não fecharam. Eles saem dessa lista sozinhos quando
            baterem alvo, stop ou virada — e só então aparecem em Resultados, com
            lucro e duração. Contas feitas em {alavancagem}x.
          </p>
          {avisos.length > 0 && (
            <p className="pr-isencao">
              Os pontos abaixo são cálculos automáticos sobre os dados recebidos.
              Não constituem recomendação de operação — a decisão é sua.
            </p>
          )}
        </div>

        <div className="pr-modo">
          <span className="pr-modo-label">Margem</span>
          <div className="pr-modo-btns">
            {(['isolado', 'cruzado'] as const).map(m => (
              <button
                key={m}
                type="button"
                className={modo === m ? 'ativo' : ''}
                onClick={() => trocarModo(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {modo === 'cruzado' && (
        <p className="pr-modo-nota">
          No modo cruzado o saldo inteiro da conta sustenta a posição, e a
          liquidação depende de quanto saldo existe contra o tamanho aberto —
          números que esta plataforma não conhece. Por isso os avisos de
          proximidade da liquidação ficam desligados aqui: confira a distância
          real na sua corretora.
        </p>
      )}

      {avisos.length > 0 && (
        <ul className="pr-lista">
          {avisos.map((a, i) => (
            <li key={i} className={`pr-item ${a.gravidade}`}>
              <div className="pr-item-topo">
                <span className="pr-tag">{a.gravidade === 'critico' ? 'CRÍTICO' : 'ATENÇÃO'}</span>
                <strong>{a.titulo}</strong>
              </div>
              <p className="pr-detalhe">{a.detalhe}</p>
              <p className="pr-acao">→ {a.consequencia}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

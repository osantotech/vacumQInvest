'use client';

import { LEVERAGE, LIQUIDATION_PCT } from '@/lib/calculations';
import { CORRELACAO_BTC_ALTA } from '@/lib/types';

export interface SinalAberto {
  ativo: string;
  direcao: string;
  preco_entrada: number | null;
  stop: number | null;
  correlacao_btc: number | null;
}

interface PainelRiscoProps {
  sinais: SinalAberto[];
  /** Alavancagem de referência para a conta de liquidação. */
  alavancagem?: number;
}

type Gravidade = 'critico' | 'atencao';

interface Aviso {
  gravidade: Gravidade;
  titulo: string;
  detalhe: string;
  acao: string;
}

/**
 * Abaixo desta fração da distância de liquidação o stop ainda funciona, mas com
 * pouca folga — taxas e margem de manutenção comem o resto.
 */
const FOLGA_MINIMA = 0.8;

function pctRisco(s: SinalAberto): number | null {
  if (s.preco_entrada === null || s.stop === null || s.preco_entrada === 0) return null;
  return (Math.abs(s.preco_entrada - s.stop) / s.preco_entrada) * 100;
}

/**
 * Traduz os sinais abertos em avisos acionáveis.
 *
 * A regra que orienta tudo aqui: nenhum aviso termina num número. Saber que o
 * stop está a 6,76% não ajuda ninguém — saber que em 20x a corretora liquida
 * antes disso, e que o teto seguro é 14x, ajuda.
 */
export function montarAvisos(sinais: SinalAberto[], alavancagem: number): Aviso[] {
  const avisos: Aviso[] = [];
  const liquidacao = 100 / alavancagem;

  for (const s of sinais) {
    const risco = pctRisco(s);
    if (risco === null) continue;

    if (risco >= liquidacao) {
      // O teto teórico ignora taxas e margem de manutenção, então a liquidação
      // real vem um pouco antes — daí arredondar para baixo.
      const levMax = Math.max(1, Math.floor(100 / risco));
      avisos.push({
        gravidade: 'critico',
        titulo: `${s.ativo}: o stop nunca vai ser acionado`,
        detalhe: `O stop está a ${risco.toFixed(2)}% da entrada, mas em ${alavancagem}x a corretora liquida a posição em ${liquidacao.toFixed(2)}%. O preço zera sua margem antes de chegar lá.`,
        acao: `Use no máximo ${levMax}x nesta operação — ou não entre nela.`,
      });
    } else if (risco >= liquidacao * FOLGA_MINIMA) {
      const usado = (risco / liquidacao) * 100;
      avisos.push({
        gravidade: 'atencao',
        titulo: `${s.ativo}: stop perto da liquidação`,
        detalhe: `O stop consome ${usado.toFixed(0)}% da distância até a liquidação em ${alavancagem}x. Sobra pouca margem para taxas e oscilação.`,
        acao: `Reduza para ${Math.max(1, Math.floor(100 / risco / 1.5))}x, ou entre com posição menor.`,
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
      titulo: `${colados.length} posições abertas são a mesma aposta`,
      detalhe: `${colados.map(s => s.ativo).join(', ')} estão com correlação acima de ${Math.round(CORRELACAO_BTC_ALTA * 100)}% com o BTC. Elas sobem e caem juntas.`,
      acao: `Abra só uma delas, ou divida o tamanho entre as ${colados.length} — senão você está com ${colados.length}x o risco que imagina.`,
    });
  } else if (colados.length === 1) {
    const s = colados[0];
    avisos.push({
      gravidade: 'atencao',
      titulo: `${s.ativo} está seguindo o BTC`,
      detalhe: `Correlação de ${Math.round((s.correlacao_btc ?? 0) * 100)}% nas últimas velas: o movimento dela é o do BTC.`,
      acao: `Antes de entrar, olhe o gráfico do BTC — é ele que vai decidir esta operação.`,
    });
  }

  // Crítico primeiro: é o que muda a decisão agora.
  return avisos.sort((a, b) => (a.gravidade === b.gravidade ? 0 : a.gravidade === 'critico' ? -1 : 1));
}

export default function PainelRisco({ sinais, alavancagem = LEVERAGE }: PainelRiscoProps) {
  const abertos = sinais.length;
  const avisos = montarAvisos(sinais, alavancagem);

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
        </div>
      </div>

      {avisos.length > 0 && (
        <ul className="pr-lista">
          {avisos.map((a, i) => (
            <li key={i} className={`pr-item ${a.gravidade}`}>
              <div className="pr-item-topo">
                <span className="pr-tag">{a.gravidade === 'critico' ? 'CRÍTICO' : 'ATENÇÃO'}</span>
                <strong>{a.titulo}</strong>
              </div>
              <p className="pr-detalhe">{a.detalhe}</p>
              <p className="pr-acao">→ {a.acao}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

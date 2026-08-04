import type { PainelSnapshot } from './types';
import { CORRELACAO_BTC_ALTA } from './types';

/**
 * Veredito de um sinal — a leitura que o diário fazia o usuário montar sozinho.
 *
 * O card já mostrava os onze campos do painel lado a lado, todos com o mesmo
 * peso visual. "DRONE a favor ✓" em verde competia de igual para igual com
 * "0.786 rompida — setup morto" em vermelho, e quem não domina a régua do Bruno
 * lia mais verde que vermelho e concluía que o sinal era bom. Não era: um
 * daqueles critérios é eliminatório e estava enterrado no meio dos outros.
 *
 * Isto NÃO decide pelo usuário. Ordenar a informação por gravidade não é
 * recomendar operação — é não esconder o que o próprio painel já dizia. Por
 * isso o texto é descritivo ("o setup deixa de valer quando…"), nunca
 * imperativo ("não entre"): a plataforma é ferramenta de análise, e a decisão
 * de entrar continua sendo inteiramente do usuário.
 */

export type NivelVeredito = 'invalidado' | 'atencao' | 'ressalvas' | 'limpo';

export interface Veredito {
  nivel: NivelVeredito;
  titulo: string;
  /** Preenchido só quando algo eliminatório derruba o setup. */
  motivo: string | null;
  ressalvas: string[];
}

export interface SinalParaAvaliar {
  painel: PainelSnapshot | null;
  tp1: number | null;
  tp2: number | null;
  correlacao_btc: number | null;
}

/** Abaixo disto a SMA200 está perto o bastante para atrapalhar o movimento. */
const SMA200_PROXIMA_PCT = 2;

/** A partir de quantas ressalvas o card passa de amarelo para laranja. */
const RESSALVAS_MUITAS = 3;

export function avaliarSinal({ painel, tp1, tp2, correlacao_btc }: SinalParaAvaliar): Veredito | null {
  // Sinal antigo, anterior ao snapshot do painel: sem base para avaliar. Um
  // veredito "limpo" aqui seria mentira por omissão — melhor não exibir nada.
  if (!painel) return null;

  const ressalvas: string[] = [];

  // ── Eliminatório: a régua do Bruno ──
  // "Rompeu a 0.786 = setup morto." É o único critério do método que invalida
  // sozinho; os demais pesam, mas não derrubam.
  if (painel.ote === 'MORTA_0786') {
    return {
      nivel: 'invalidado',
      titulo: 'Setup invalidado',
      motivo:
        'O preço rompeu a 0.786 do Fibonacci. Pela régua do método, o movimento ' +
        'que dava origem a esta entrada deixa de valer a partir daí — a retração ' +
        'foi funda demais para o impulso ainda ser o dominante.',
      ressalvas: coletarRessalvas(painel, tp1, tp2, correlacao_btc),
    };
  }

  ressalvas.push(...coletarRessalvas(painel, tp1, tp2, correlacao_btc));

  if (ressalvas.length === 0) {
    return {
      nivel: 'limpo',
      titulo: 'Sem ressalvas',
      motivo: null,
      ressalvas,
    };
  }

  return {
    nivel: ressalvas.length >= RESSALVAS_MUITAS ? 'atencao' : 'ressalvas',
    titulo: ressalvas.length >= RESSALVAS_MUITAS ? 'Muitas ressalvas' : 'Com ressalvas',
    motivo: null,
    ressalvas,
  };
}

function coletarRessalvas(
  p: PainelSnapshot,
  tp1: number | null,
  tp2: number | null,
  corr: number | null
): string[] {
  const r: string[] = [];

  if (p.drone === 'CONTRA') {
    r.push('O gráfico maior está na direção oposta a esta entrada.');
  }

  if (p.baliz === 'ENFRAQUECENDO') {
    r.push('O preço perdeu a média rápida — o movimento está perdendo força.');
  } else if (p.baliz === 'ATENCAO') {
    // Vale lembrar (auditoria): esta é a MESMA condição de "impulso contra a
    // operação" exibida no Fibonacci. Dois campos da tela, um só fato.
    r.push('As médias ainda não confirmaram a direção: a rápida segue do lado errado da lenta.');
  }

  if (p.estrutura === 'TOPO_MENOR' || p.estrutura === 'FUNDO_MAIOR') {
    r.push('A estrutura de topos e fundos já sinaliza saída.');
  }

  // Risco conhecido e retorno desconhecido não é o mesmo que risco/retorno ruim
  // — é a impossibilidade de calcular um.
  if (tp1 === null && tp2 === null) {
    r.push('Sem alvo definido: a perda máxima é conhecida, o ganho possível não.');
  }

  if (corr !== null && Math.abs(corr) >= CORRELACAO_BTC_ALTA) {
    r.push(
      `Segue o BTC em ${Math.round(Math.abs(corr) * 100)}% — não é uma aposta independente. ` +
      'Somada a outra posição correlacionada, vira a mesma aposta em dobro.'
    );
  }

  if (p.sma200_pct !== null && Math.abs(p.sma200_pct) < SMA200_PROXIMA_PCT) {
    r.push(
      `A ${Math.abs(p.sma200_pct).toFixed(2).replace('.', ',')}% da SMA200: ` +
      'a parede de longo prazo está no caminho do movimento.'
    );
  }

  return r;
}

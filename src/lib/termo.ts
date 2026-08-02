import { createHash } from 'crypto';

/**
 * ⚠️ RASCUNHO — NÃO É PARECER JURÍDICO.
 *
 * Escrito por um assistente de programação, não por advogado. Serve para
 * testar o fluxo de aceite ponta a ponta. ANTES de abrir a plataforma a
 * qualquer usuário que não seja o próprio dono, este texto deve ser
 * substituído por redação de advogado.
 *
 * Ao trocar o texto, SUBA A VERSÃO. O hash muda junto e o sistema volta a
 * pedir aceite — é isso que impede a situação de provar o aceite de um termo
 * que já não é o vigente.
 */
export const TERMO_VERSAO = '0.1-rascunho';

export const TERMO_TITULO = 'Termo de Uso e Ciência de Risco';

export const TERMO_TEXTO = `
1. O QUE É ESTA PLATAFORMA

O VacumQInvest é uma ferramenta de apoio à análise técnica. Ele coleta sinais
gerados por indicadores configurados pelo próprio usuário, organiza esses dados
em tabelas e gráficos, e calcula métricas a partir deles.

A plataforma NÃO é corretora, NÃO executa ordens, NÃO custodia valores e NÃO
tem acesso à sua conta em nenhuma exchange.

2. O QUE ELA NÃO É

Nada do que é exibido aqui constitui recomendação de investimento, consultoria
de valores mobiliários, oferta, promessa de rentabilidade ou garantia de
resultado. As informações são apresentadas para leitura e interpretação do
usuário.

A plataforma não avalia seu perfil de investidor, sua situação financeira, seus
objetivos nem sua tolerância a risco. Portanto, nada aqui é adequado ou
inadequado a você — isso é uma avaliação que só você pode fazer.

3. DECISÃO E RESPONSABILIDADE

Toda decisão de abrir, manter, aumentar, reduzir ou encerrar qualquer operação
é exclusiva do usuário, tomada por sua conta e risco.

O usuário declara ter conhecimento próprio para interpretar os dados exibidos e
reconhece que a análise final é de sua inteira responsabilidade.

4. RISCOS QUE VOCÊ ASSUME

O usuário declara estar ciente de que:

a) O mercado de criptomoedas é volátil e opera 24 horas por dia. Perdas podem
   ocorrer de forma rápida e integral.

b) Operações alavancadas podem resultar na perda total da margem. Em
   alavancagem de 20x, uma variação de aproximadamente 5% contra a posição zera
   a margem. Quanto maior a alavancagem, menor a variação necessária.

c) A plataforma pode exibir avisos de risco calculados automaticamente. Esses
   avisos são cálculos matemáticos sobre os dados recebidos, não ordens nem
   recomendações. Ignorá-los ou segui-los é decisão do usuário.

d) Indicadores técnicos são baseados em dados passados. Resultado passado não
   garante resultado futuro.

5. LIMITES TÉCNICOS

Os dados exibidos dependem de serviços de terceiros (TradingView, exchanges,
provedores de dados e hospedagem). Podem ocorrer atraso, indisponibilidade,
falha de entrega ou erro de cálculo.

A plataforma não garante disponibilidade contínua nem exatidão dos dados. O
usuário não deve tomar decisão com base exclusiva no que é exibido aqui, sem
conferir a informação na sua corretora.

6. REGISTROS

Para fins de segurança e auditoria, a plataforma registra a data e a hora do
aceite deste termo, a versão aceita, o endereço de rede de origem, e quais
avisos de risco foram exibidos na tela do usuário.

Esses registros são mantidos enquanto durar a relação de uso e pelo prazo
necessário ao cumprimento de obrigações legais. O usuário pode solicitar acesso
aos seus registros a qualquer momento.

7. LIMITAÇÃO DE RESPONSABILIDADE

Na máxima extensão permitida pela lei aplicável, a plataforma e seus
responsáveis não respondem por perdas, lucros cessantes, danos diretos ou
indiretos decorrentes de decisões de investimento tomadas pelo usuário, nem por
falhas de serviços de terceiros dos quais a plataforma depende.

8. ACEITE

Ao marcar a caixa de confirmação e prosseguir, o usuário declara que leu,
entendeu e concorda com este termo, e que assume integralmente a
responsabilidade pelas decisões que tomar a partir das informações exibidas.
`.trim();

/**
 * Hash do conteúdo exato, gravado junto do aceite.
 *
 * É o que responde à alegação "o termo que eu aceitei era diferente": basta
 * recalcular o hash do texto arquivado e comparar com o que está no registro.
 */
export function hashTermo(texto: string = TERMO_TEXTO): string {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}

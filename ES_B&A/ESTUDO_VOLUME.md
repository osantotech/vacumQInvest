# Estudo — Volume aplicado ao ES_B&A

**Data:** 04/08/2026
**Pergunta:** o volume (tamanho, picos, compra × venda) melhora os sinais do ES_B&A?
**Base:** 995 operações · 8 moedas · velas de 2h · ~83 dias · Binance Futures

---

## 0. Ressalva sobre a origem deste estudo

Não existe "banco de dados de traders" por trás disto. O que há é:

1. **Literatura pública** de análise de volume (Wyckoff, VSA/Tom Williams) — o
   corpo teórico que embasa as hipóteses testadas.
2. **Dados reais de mercado** baixados da API pública da Binance Futures,
   medidos aqui.

Nenhuma operação de nenhum trader real foi consultada. As conclusões valem pelo
que os dados mostram, não por autoridade de quem quer que seja.

---

## 1. O que o TradingView permite de fato

| Recurso | Disponível no Pine? | Observação |
|---|---|---|
| `volume` da vela | **Sim**, nativo | é o que o VQ Pullback já usa |
| Média de volume | **Sim** | `ta.sma(volume, n)` |
| Compra × venda separados | **Não diretamente** | exige `request.security_lower_tf()` |
| Volume Profile / Footprint | **Não em Pine** | ferramenta da plataforma, planos superiores |

**Sobre o volume de compra/venda que o Bruno menciona:** ele existe, mas o Pine
não recebe esse dado pronto. Dá para **aproximá-lo** com
`request.security_lower_tf()` — pegando velas de 1 minuto dentro da vela de 2h e
classificando cada uma pela direção. É aproximação por vela, não por negócio.

Há dois custos: o limite de velas intrabar do TradingView (menor no plano
Essential) e a complexidade do código. **Os dados abaixo dizem que não vale a
pena** — ver seção 4.

Neste estudo usei o **delta verdadeiro**, que a API da Binance fornece no campo
`takerBuyBaseVolume`, justamente para saber se valeria o esforço de aproximá-lo
no Pine. Não vale.

---

## 2. As cinco hipóteses testadas

| # | Hipótese | Origem teórica |
|---|---|---|
| 1 | Rompimento com volume acima da média é melhor | senso comum de mercado |
| 2 | Delta (agressor) a favor do rompimento é melhor | order flow |
| 3 | Muito volume + corpo pequeno = absorção = pior | Wyckoff *effort vs result* |
| 4 | Pico climático de volume marca movimento real | Wyckoff *climax* |
| 5 | Rompimento com delta divergente é pior | divergência de order flow |

**Primeiro resultado, antes de qualquer número individual:** as cinco apontaram
na direção que a teoria prevê. Se cada uma fosse ruído, a chance de todas
apontarem para o lado certo é de 1 em 32 (~3%). O conjunto já sugere que há
sinal em volume — mesmo antes de olhar cada teste isolado.

---

## 3. O achado principal — pico de volume

O retorno **médio** não muda de forma comprovável. **A taxa de acerto muda — e
muito.**

| Filtro | Acerto | Contra o resto | p-valor |
|---|---|---|---|
| Volume ≥ **2,5×** a média | **42,9%** (27/63) | 22,1% (206/932) | **0,0002** |
| Volume ≥ **3×** a média | **48,6%** (18/37) | 21,8% (209/958) | **0,0001** |
| Volume ≥ 4× a média | 50,0% (8/16) | 23,2% | amostra pequena demais |

**O acerto praticamente dobra.**

E o efeito é **monotônico** — cresce conforme o limiar sobe (27% → 31% → 43% →
49% → 50%). Efeito que cresce com a dose é muito mais difícil de ser acaso que
um ponto isolado.

### Sobrevive ao rigor

Rodei cerca de doze testes neste estudo. Testar muitas hipóteses produz falsos
positivos: com doze testes, o limiar de 5% precisa virar **0,42%** (correção de
Bonferroni).

| Achado | p-valor | Passa com Bonferroni? |
|---|---|---|
| Volume ≥ 2,5× | 0,0002 | **Sim** |
| Volume ≥ 3× | 0,0001 | **Sim** |
| Delta a favor | 0,0258 | **Não** |

**O pico de volume sobrevive. O delta não.**

---

## 4. O delta (compra × venda) — por que fica de fora

| | Acerto |
|---|---|
| Delta a favor do rompimento | 24,9% (200/804) |
| Delta contra | 17,3% (33/191) |

A diferença existe e vai na direção certa (p = 0,026), mas **não sobrevive à
correção para múltiplos testes**. E é justamente o dado mais caro de obter no
Pine: aproximação por `request.security_lower_tf()`, com limite de histórico e
complexidade real de código.

**Custo alto, evidência fraca. Não implementar.**

Se um dia houver amostra maior — com mais moedas e mais meses — vale reabrir.
Anotado como pendência, não como conclusão negativa definitiva.

---

## 5. Absorção e divergência

| Hipótese | Resultado | Veredito |
|---|---|---|
| Absorção (volume alto + corpo pequeno) | n=6 · pior em −0,49% | **amostra pequena demais para concluir** |
| Divergência de delta | 17,3% de acerto vs 26,1% | é o espelho do teste de delta, mesma limitação |

A absorção é um conceito sólido em Wyckoff, mas com 6 ocorrências em 995
operações não há o que medir. Provavelmente porque o critério que usei foi
restritivo demais (volume > 1,5× **e** corpo < 0,7× o médio simultaneamente).

---

## 6. O que isso significa para o ES_B&A

**O ES_B&A é o único dos três indicadores do projeto que não olha volume
nenhum.** O VQ Pullback já usa a regra 5× do Bruno e o "volume seco" no Score.
O Modo Grécia tem seus próprios filtros. O ES_B&A não tem nada.

E o dado diz que volume é **o filtro mais forte encontrado em toda a
investigação até agora** — mais forte que a zona crítica, que a compressão de
médias, que o intervalo entre flips e que o "igualou". Todos esses falharam nos
testes. O pico de volume passou, e com folga.

### Proposta (não implementada)

Um campo no painel e um marcador no gráfico, no espírito das rodinhas:

> **Volume:** `PICO 2,8x ◆◆` — rompimento com participação forte

E, no campo **Por quê**, acrescentar a informação:

> fechou 0,84% ACIMA da amarela, corpo forte, **volume 2,8× a média**

**O que NÃO fazer:** filtrar os sinais de volume baixo. Pelas mesmas razões da
zona crítica — os sinais sem pico ainda acertam 22% e continuam sendo o método
que o Bruno ensina. O papel da rodinha é **informar que este sinal é dos bons**,
não esconder os outros.

Sugestão de limiar: **2,5×**, por três motivos — é onde o efeito aparece com
clareza, ainda produz 63 ocorrências em 995 (6,3%, raro mas não inexistente), e
está no meio do caminho entre o volume de confirmação do VQ Pullback (1,5×) e a
regra 5× do Bruno.

---

## 7. Limitações honestas

1. **83 dias.** Um regime de mercado só. Volume climático pode se comportar
   diferente em tendência forte e em lateralização longa.
2. **Só o acerto melhora, não o retorno médio.** Acerta o dobro das vezes, mas
   os ganhos são menores — o resultado médio não muda de forma comprovável.
   Para o propósito pedagógico isso ainda vale muito: a experiência de acertar
   43% em vez de 22% é psicologicamente outra coisa para quem está aprendendo.
3. **Testei o esqueleto mecânico**, sem stop e sem gestão — como em toda a
   auditoria do ES_B&A.
4. **O limiar 2,5× foi escolhido olhando estes dados.** Sempre há risco de estar
   ajustando ao passado. O fato de o efeito ser monotônico reduz esse risco, mas
   não o elimina: o número honesto virá do uso real.

---

*Estudo de leitura e medição. Nenhuma alteração foi feita em nenhum `.pine`.*

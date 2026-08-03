# Auditoria — VQ Pullback v1.8

**Escopo:** código Pine (965 linhas) confrontado com o `Guia_VQ_Pullback_v1_9.md`.
**Data:** 02/08/2026
**Método:** leitura bloco a bloco — motor PST → máquina de estados → score → contexto v1.8 → estatísticas.

**O que esta auditoria responde:** o indicador faz o que promete?
**O que ela NÃO responde:** a estratégia ganha dinheiro? Isso exige execução real ao longo de meses.

---

## Quadro geral

| # | Achado | Tipo | Gravidade |
|---|---|---|---|
| 1 | `nz()` força LONG nas primeiras barras do histórico | Borda | Baixa |
| 2 | Fatores do score precisam coincidir na mesma vela | Desenho | — |
| 3 | `f2` e `f5` são quase mutuamente exclusivos | Consequência | — |
| 4 | Pullback é irreversível: bloqueia o ED no ciclo | Desenho | — |
| 5 | Existem **dois** Fibonaccis, com âncoras e zonas distintas | Ambiguidade | Média |
| 6 | Dois limiares para "corpo forte" (1.2× e 1.5×) | Inconsistência | Baixa |
| 7 | Código e guia afirmam alinhamento do impulso que não existe | Documentação | **Alta** |
| 8 | Aviso de estrutura nunca se desarma | **BUG** | **Alta** |
| 9 | Fibonacci desenhado só existe no presente | Limitação | Média |
| 10 | Backtest abre no flip, não nos sinais operados | Modelo | **Alta** |
| 11 | Operações perdedoras contabilizadas como breakeven | Modelo | **Alta** |
| 12 | "Ganhos" incluem trades que voltaram a zero | Modelo | **Alta** |
| 13 | T1/T2/T3 medem excursão máxima, não resultado | Modelo | **Alta** |
| 14 | Stops intra-bar são ignorados | Modelo | **Alta** |

---

## O que passou sem ressalva

**Motor PST** — fiel ao algoritmo de LonesomeTheBlue, com tratamento de `na`
melhor que o original.

**Ausência de repaint nos sinais** — `ta.pivothigh` gera *atraso* de confirmação,
não reescrita do passado. Combinado a `alert.freq_once_per_bar_close`, o alerta
que dispara é o mesmo que fica no histórico.

**Independência de ativo** — nenhuma comparação de preço contra constante em
todo o arquivo. Tudo é percentual, ATR ou múltiplo de média. O indicador se
comporta igual em BTC a US$ 64.000 e em moedas de fração de centavo. *Era o
pedido central desta auditoria, e ele passa.*

**Disparo único por ciclo** — os três sinais usam detecção de borda, não de
estado. Nenhum se repete dentro do mesmo ciclo.

**Guardas numéricas** — `rng > 0`, `brkPrice > 0` e verificações de `na` estão
presentes onde importa.

---

## Os dois achados que exigem correção

### Achado 8 — o aviso de estrutura não se desarma (BUG)

```pine
if pstFlipLong or pstFlipShort
    exitWarn := false          // só o flip reseta
if topoMenor or fundoMaior
    exitWarn := true
```

Formado um topo menor, o painel exibe **"TOPO MENOR ⚠ saída"** até o próximo
flip — mesmo que o preço faça topos maiores depois e a estrutura se recomponha.

O guia define aquele campo como *"topos/fundos OK ✓ = estrutura ainda saudável"*.
Hoje ele não volta a dizer isso.

**Correção (3 linhas):** rearmar quando um pivô superar o anterior.

**Efeito colateral:** o campo `estrutura` gravado no diário herda o mesmo defeito.

### Achado 7 — a documentação afirma o que o código não faz

Linha 193 do Pine e seção 5 do guia dizem que o Fibonacci fica *"sempre do lado
da sua operação"*. **É falso.** `impDir` vem das médias; `pos` vem da PST.
Observado ao vivo no SOLUSDT: `Estado LONG` com `impulso BAIXA` e alvos abaixo
do preço.

**Mas a divergência é informação, não defeito:**

```pine
balizOK (LONG) = smaW > smaY
impDir         = smaW >= smaY ? 1 : -1
```

São a mesma condição. Impulso invertido **é** o balizador fraco, dito em outro
lugar da tela.

**Correção recomendada:** ajustar o texto (código e guia) para descrever o
comportamento real. Forçar `impDir := pos` cumpriria a promessa, mas apagaria
o aviso — o Fibonacci passaria a mentir junto com a expectativa.

---

## As ESTATISTICAS não devem guiar decisão

Cinco vieses independentes, **todos para o mesmo lado**:

| Viés | Efeito |
|---|---|
| Abre no flip, não nos sinais | mede outro sistema |
| Perda no flip vira breakeven | esconde prejuízo |
| Volta a zero após TP1 vira win | infla o acerto |
| T1/T2/T3 por excursão máxima | infla o ganho aparente |
| Só olha `close` | ignora todo stop intra-bar |

**O desempenho real é pior que os 35% exibidos.** Quanto pior, o Pine sozinho
não permite saber.

O guia já avisa (seção 7) que é *"modelo simplificado"*. O problema é que a
tabela aparece grande, com números precisos, e ninguém lê o rodapé antes de
confiar nela.

**Consequência prática:** o diário de operações passa a ser a única fonte
honesta de desempenho — ele registra entrada e saída reais, sem modelo no meio.

---

## Características de desenho (não são erros)

**Os fatores do score precisam coincidir na mesma vela** — só o volume 5x é
acumulado; os outros quatro são avaliados na barra corrente. Isso torna PBv e
PPB-ec estruturalmente raros, e explica por que os 4 primeiros sinais reais
foram todos ED.

**`f2` (volume < metade da média) e `f5` (corpo 1,5× acima do médio) quase nunca
marcam juntos** — corpo grande costuma vir com volume. O teto prático do score
é 4, não 5, e o limiar de 3 é mais exigente do que aparenta.

**O pullback é irreversível** — uma vez em `phase 2`, não há retorno. Um mergulho
de um tick abaixo do rompimento fecha a porta do ED para todo o ciclo, mesmo que
o preço retome com força.

Nenhuma dessas é erro de implementação. São escolhas com consequência prática,
e mexer nelas é mudar o método — decisão do trader, não do auditor.

---

## Recomendação

**Corrigir:** Achado 8 (bug), Achado 7 (texto), Achado 6 (unificar limiar de
corpo num input).

**Documentar:** Achado 5 (deixar explícito no guia que existem dois Fibonaccis,
com âncoras e zonas diferentes — o Score não reflete a OTE desenhada).

**Decidir:** o que fazer com as ESTATISTICAS. Corrigir os vieses 11 a 14 é
factível; alinhar o backtest aos sinais reais (viés 10) exigiria reescrevê-lo.

**Não mexer:** achados 2, 3 e 4 sem decisão explícita sobre o método.

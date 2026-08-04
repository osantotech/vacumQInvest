# Auditoria — ES Rompimentos SMAs B&A v1.1

**Arquivo:** `ES_RompimentosSMAs_BA_v1_1.pine` (243 linhas)
**Confrontado com:** `Guia_VQ_Pullback_v1_9.md` e o `VQ_Pullback_v1_9.pine`
**Data:** 04/08/2026
**Método:** leitura linha a linha + replicação da lógica em 5 moedas × 1.000 velas de 2h (~83 dias)

**Nenhuma linha do `.pine` foi alterada.** Auditoria é leitura; qualquer correção
depende de autorização.

---

## 1. O que o indicador faz, especificamente

Um sistema de **cruzamento de média**, na sua forma mais direta:

| Evento | Condição no código | O que acontece |
|---|---|---|
| Entrada LONG | `close > smaY` e `close[1] <= smaY[1]` | seta verde grande, `pos := 1` |
| Entrada SHORT | `close < smaY` e `close[1] >= smaY[1]` | seta vermelha grande, `pos := -1` |
| Saída | — | **não existe saída separada**: o sinal contrário inverte a posição |

A **amarela (SMA 21)** é o gatilho. A **branca (SMA 8)** só emite alerta antecipado
(seta pequena) e não muda o estado. Não há stop, não há alvo, não há filtro de
tendência maior.

Além disso ele exibe:
- **Falso rompimento** (✕ cinza): o pavio furou a amarela mas o fechamento voltou
- **Força** (FORTE ◆ / TÍMIDO ◇): corpo > 1,5× a média **e** distância ≥ 0,3% da amarela
- **Zona** (ACIMA / CRÍTICA / ABAIXO): posição do preço em relação às duas médias
- **Painel** com estado, zona, último sinal, força e as duas distâncias

Timeframe de referência declarado no cabeçalho: **2 horas** (MAC).

---

## 2. A resposta que estávamos esperando: são SMA

```pine
float smaW = ta.sma(close, smaWLen)   // 8
float smaY = ta.sma(close, smaYLen)   // 21
```

**Simples, não exponenciais. Períodos 8 e 21. Fonte `close`.**

São **exatamente as mesmas** do `VQ_Pullback_v1_9.pine` (linhas 118-119).

**Consequência: não existe o descasamento que suspeitávamos.** As linhas que
aparecem na tela pelo ES_B&A são idênticas às que o VQ Pullback calcula por
baixo. O balizador, o impulso do Fibonacci, o fator 4 do Score, o Stop AMA e a
qualidade do PPB-ec estão todos falando da mesma linha que o trader enxerga.

**Nada a mudar.** A troca `ta.sma` → `ta.ema` que estava em avaliação está
descartada.

---

## 3. O que passou sem ressalva

**Detecção de cruzamento correta.** `close > smaY and close[1] <= smaY[1]` é a
forma canônica, equivalente a `ta.crossover()`. Exige fechamento confirmado —
fiel à regra do Bruno [01:27] *"rompeu, fechou acima"*.

**Sem repaint.** Só usa `close`, `high`, `low` e SMAs da barra corrente e da
anterior. Nenhum `request.security`, nenhum pivô com confirmação atrasada. O que
o gráfico mostra hoje é o que mostrava quando a vela fechou.

**Falso rompimento corrigido de verdade.** A v1.1 trocou a comparação contra o
candle anterior por um rastreamento do **último lado confirmado** (`ladoReal`).
É a implementação correta da regra [20:21], e `falsoUp` é mutuamente exclusivo
com `rompAmaUp` — não há como um sinal ser rompimento e falso ao mesmo tempo.

**Independência de ativo.** Nenhuma comparação de preço contra constante. Tudo
é percentual ou múltiplo de média. Funciona igual em BTC e em moeda de centavo.

**Guardas de `na`.** A variável `ok` protege todas as comparações enquanto as
médias não têm dados.

---

## 4. Achados

| # | Achado | Tipo | Gravidade |
|---|---|---|---|
| 1 | O indicador manda entrar e não entrar ao mesmo tempo | **Contradição** | **Alta** |
| 2 | "CRÍTICA ⚠" aparece quando não há dado nenhum | Borda | Baixa |
| 3 | Rompimento e falso usam critérios diferentes de "lado" | Inconsistência | Baixa |
| 4 | FORTE/TÍMIDO espreme três estados em dois rótulos | Rotulagem | Média |
| 5 | Falsos rompimentos aparecem mais que os próprios sinais | Ruído | Média |
| 6 | Rodapé declara v1.0 num arquivo v1.1 | Trivial | — |
| 7 | `pos` e `sigDir` guardam a mesma informação | Código morto | — |

### Achado 1 — o indicador se contradiz na mesma tela (ALTA)

O cabeçalho declara, na linha 132:

```
// CRITICA: close entre as duas SMAs  → NAO entre, espere
```

E o painel exibe **"CRITICA ⚠"** nessa situação.

Mas a entrada é disparada **só** por cruzar a amarela, sem olhar a branca:

```pine
bool rompAmaUp = ok and close > smaY and close[1] <= smaY[1]
if rompAmaUp
    pos := 1        // seta verde GRANDE
```

Quando a branca está **acima** da amarela (tendência de alta) e o preço volta de
baixo, cruzando a amarela mas ainda **abaixo da branca**, temos:

- `close > smaY` → **seta verde grande: ENTRE LONG**
- `close < smaW` → nem `zAcima` nem `zAbaixo` → **painel: CRÍTICA ⚠, não entre**

**Medido em 618 sinais reais (5 moedas, 2h, 83 dias): acontece em 87 deles —
14,1%.** Um a cada sete sinais nasce se contradizendo.

Não é caso de borda. É um cenário comum: correção dentro de tendência que retoma.

**Não há correção óbvia**, porque as duas regras vêm de lugares diferentes — o
gatilho vem da aula MAC 3.0, a zona de três faixas vem de um "Estudo TradingView"
citado no comentário da linha 130. Resolver exige decidir **qual das duas manda**,
e isso é decisão de método, não de programação.

### Achado 2 — "CRÍTICA" sem dado (BAIXA)

```pine
string zTxt = zAcima ? "ACIMA ✓" : zAbaixo ? "ABAIXO ✗" : "CRITICA ⚠"
```

`zAcima` e `zAbaixo` já contêm `ok`. Quando as médias ainda são `na` (primeiras
21 velas), ambas são `false` e o painel exibe **"CRÍTICA ⚠"** — um aviso de
mercado onde só existe ausência de dado. Deveria ser `—`, como o campo Estado já
faz corretamente com "FORA ○".

### Achado 3 — dois conceitos de "lado" (BAIXA)

O rompimento pergunta pela **barra anterior** (`close[1] <= smaY[1]`); o falso
pergunta pelo **último lado confirmado** (`ladoReal[1] == -1`). São critérios
diferentes para a mesma ideia.

Diverge quando um fechamento cai exatamente sobre a média: `ladoReal` não muda
(o código só atribui em `>` e `<`, nunca em `==`), mas `close[1] <= smaY[1]` é
verdadeiro. O sinal seguinte dispara como se houvesse troca de lado sem que ela
tenha existido.

Exige empate exato, então é raro em cripto com muitas casas decimais. Registrado
por consistência, não por urgência.

### Achado 4 — "TÍMIDO" quer dizer três coisas (MÉDIA)

```pine
bool ehForte = corpoForte and not ehTimido
```

`FORTE` exige **corpo grande E longe da amarela**. Tudo que falha vira `TÍMIDO`:

- corpo enorme mas a 0,2% da amarela → TÍMIDO
- corpo fraco mas a 5% da amarela → TÍMIDO
- corpo fraco e colado → TÍMIDO

Três situações operacionalmente distintas com o mesmo rótulo. **Medido: 64% dos
sinais saem como TÍMIDO** — um rótulo que aparece em dois terços das vezes
descreve pouco.

### Achado 5 — o ✕ satura a tela (MÉDIA)

**Medido: 672 falsos rompimentos contra 618 sinais.** O ✕ cinza aparece **mais
vezes** que as próprias setas de entrada.

A lógica está correta — o problema é de densidade. Como o preço orbita a média,
quase toda vela que a toca sem confirmar marca um ✕. O input `showFalso` permite
desligar, e provavelmente é o que se deve fazer em uso diário.

---

## 5. A contradição com o VQ Pullback — e por que ela existe

Esta é a parte mais importante para quem usa os dois na mesma tela.

**`Guia_VQ_Pullback_v1_9.md`, seção 3, campo "Estrutura":**

> É a regra literal do 7M: *"cruzamento de média não dispara saída; precisa de
> topo menor (long) ou fundo maior (short) para confirmar."*

**O ES_B&A faz exatamente o que essa frase proíbe.** Ele sai — e ainda inverte —
no cruzamento da média, sem olhar topo nem fundo.

Não é erro de nenhum dos dois. É que **implementam camadas diferentes do mesmo
método**:

| | ES_B&A v1.1 | VQ Pullback v1.9 |
|---|---|---|
| Fonte | aula **MAC 3.0** — "Como entrar e sair" | módulo **7M** + Águia Spread |
| Gatilho | cruzamento close × amarela | flip da PST → ED / PBv / PPB-ec |
| Saída | flip no cruzamento contrário | stop PST, alvo Fibonacci, ou estrutura |
| Estrutura | **não olha** | topo menor / fundo maior |
| Timeframe | 2h | 30m com drone de 2h |
| Webhook | `alertcondition` — não integra | `alert()` com JSON |

O MAC 3.0 é a versão **simples** do método; o 7M é o **refinamento** que
acrescenta a estrutura justamente para evitar sair cedo demais no cruzamento.

**Consequência prática: com os dois na tela, você vai receber ordens opostas.**
O ES_B&A vai mandar inverter enquanto o VQ Pullback exibe "topos/fundos OK ✓ —
SEGURE". Já vimos isso valer dinheiro: no NEARUSDT de 02-03/08, a operação que
seguiu a estrutura saiu de +1,19% para +3,68%.

---

## 6. O que os números dizem

Replicação da lógica em NEAR, SOL, LINK, ETH e BTC — 1.000 velas de 2h cada:

**Frequência de sinais**

| Moeda | Sinais | Em zona crítica | Falsos | FORTE / TÍMIDO |
|---|---|---|---|---|
| NEAR | 139 | 23 (17%) | 139 | 57 / 82 |
| SOL | 107 | 15 (14%) | 137 | 41 / 66 |
| LINK | 130 | 20 (15%) | 129 | 39 / 91 |
| ETH | 128 | 15 (12%) | 149 | 42 / 86 |
| BTC | 114 | 14 (12%) | 118 | 41 / 73 |
| **Total** | **618** | **87 (14,1%)** | **672** | **220 / 398** |

São **7,4 sinais por dia** somando as cinco moedas — um flip a cada ~14 horas por
ativo, em gráfico de 2h. É muito giro para um sistema que inverte a posição a
cada sinal.

**Desempenho do cruzamento puro** (entra no sinal, inverte no seguinte, sem stop
e sem gestão):

| Moeda | Trades | WR | Média | Soma |
|---|---|---|---|---|
| NEAR | 138 | 23,9% | −0,30% | **−41,4%** |
| SOL | 106 | 29,2% | +0,17% | +18,1% |
| LINK | 129 | 24,0% | −0,01% | −1,6% |
| ETH | 127 | 22,0% | −0,01% | −1,7% |
| BTC | 113 | 24,8% | +0,01% | +0,9% |
| **Total** | **613** | **24,6%** | — | **−25,7%** |

**Ressalva obrigatória:** isto mede o **esqueleto mecânico literal** do que o
indicador desenha — sem stop, sem alvo, sem filtro de estrutura, sem a leitura
do trader e sem custo de corretora (que tornaria o resultado pior ainda, com 613
operações). **Não é o método do Bruno**, que usa estrutura para decidir a saída.

Mas responde à pergunta que importa: **o cruzamento sozinho não sustenta um
sistema.** Ele é uma ferramenta de leitura de tendência, não um gerador de
entradas autônomo — e o indicador o apresenta com seta verde grande, que é a
linguagem visual de "entre aqui".

---

## 7. Conclusão

**A lógica de criação está correta** no sentido que importa para uma auditoria:
o código faz o que o cabeçalho promete, implementa fielmente as regras citadas
da aula, não repinta, não trava, e trata os casos de dado ausente. As correções
declaradas na v1.1 (falso rompimento e remoção de código morto) foram de fato
aplicadas.

**Os problemas não são de implementação, são de desenho:**

1. Duas regras de origens diferentes se contradizem em 14% dos sinais (achado 1)
2. O critério de saída conflita com o do 7M, que é o método mais completo que
   vocês adotaram no VQ Pullback
3. A apresentação sugere autonomia ("seta verde grande = entrada") que os
   números não sustentam

**Recomendações, em ordem — todas dependem da sua autorização:**

- **Nada a fazer nas médias.** São idênticas às do VQ Pullback. Assunto encerrado.
- **Decidir o papel do ES_B&A.** Se ele é leitura de tendência de 2h para dar
  contexto, está ótimo como está — e nesse caso vale desligar `showFalso` para
  limpar a tela. Se ele é gerador de entrada, o achado 1 precisa de decisão.
- **Achado 1 (contradição):** decisão de método. Ou o gatilho passa a exigir a
  zona (`close > smaW and close > smaY`), ou a zona crítica deixa de dizer "não
  entre". As duas coisas não podem coexistir como estão.
- **Achado 2 (CRÍTICA sem dado):** correção de uma linha, sem efeito colateral.
- **Achados 4 e 5:** rotulagem e densidade visual. Melhoram a leitura, não mudam
  sinal nenhum.

**O que eu não faria:** usar o ES_B&A e o VQ Pullback como fontes de decisão ao
mesmo tempo. Eles discordam por construção no critério de saída, e discordar no
meio de uma operação aberta é pior que não ter o segundo indicador.

---

*Auditoria de leitura. Nenhuma alteração foi feita no arquivo `.pine`.*

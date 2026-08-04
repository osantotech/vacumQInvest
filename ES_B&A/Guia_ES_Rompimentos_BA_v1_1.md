# Guia — ES Rompimentos SMAs B&A v1.1

Indicador 3 do projeto VacumQInvest. Baseado **exclusivamente** na aula do Bruno Aguiar *MAC3.0 — Como entrar e sair de uma operação*. Puro e simples: só rompimentos das SMAs branca e amarela, com confirmação de fechamento de candle.

> **Timeframe recomendado pelo Bruno:** gráfico de **2 horas** (MAC). Ele repete no vídeo: "gráfico de 2 horas sempre, vocês que são do Mac".

---

## 1. A ideia central (o que o Bruno ensina)

O indicador traduz em sinais gráficos o ciclo exato que o Bruno demonstra no vídeo:

1. **Entrada** — o candle **fecha** acima da SMA amarela → COMPRA (long). Se fecha abaixo → VENDA (short).
2. **Permanência** — enquanto a amarela não for rompida no sentido contrário, você **segura** e captura o spread.
3. **Saída + reversão (flip)** — quando o candle fecha do outro lado da amarela, você **sai da operação e entra na contrária** no mesmo sinal.

A regra de ouro do Bruno, que o indicador respeita à risca:

> **O gatilho é o FECHAMENTO do candle, nunca o toque.** Um candle que só encosta na amarela com o pavio, mas fecha do lado de onde veio, **não é rompimento** — é um falso.

---

## 2. Os sinais no gráfico

| Símbolo | Onde aparece | O que significa | Ação |
|---|---|---|---|
| **▲ verde GRANDE** | abaixo do candle | Candle fechou **acima** da amarela | **ENTRE LONG** (e saia de short, se estava) |
| **▼ vermelho GRANDE** | acima do candle | Candle fechou **abaixo** da amarela | **ENTRE SHORT** (e saia de long, se estava) |
| △ verde claro pequeno | abaixo do candle | Preço cruzou a **branca** para cima | Alerta antecipado — fique atento, ainda não é entrada |
| ▽ vermelho claro pequeno | acima do candle | Preço cruzou a **branca** para baixo | Alerta antecipado |
| ✕ cinza | acima/abaixo do candle | **Falso rompimento** — tocou a amarela mas fechou de volta | NÃO faça nada. É o "candle pequeno" que o Bruno manda ignorar |

### Por que a seta grande é a amarela e a pequena é a branca?

No vídeo, o Bruno marca a **entrada** com uma seta grande no candle que rompe e fecha além da **amarela**. A **branca** (média rápida) é o primeiro aviso de que o preço está mudando de lado — por isso ela vira uma seta menor, um "olho aberto" antes da confirmação. A amarela é quem **decide**; a branca só **avisa**.

### O falso rompimento (✕) — o detalhe que separa o amador do profissional

Este é o coração da aula. Nas suas imagens da DUSK, o Bruno aponta com o mouse (formato de mão) um candle verde pequeno que **toca** a linha amarela mas **não fecha acima** dela. Ele é categórico: *"rompeu e voltou pra baixo, ele não fechou o candle acima da amarela"* — ou seja, **não vale**. Só o candle seguinte, que fecha inteiro acima, é que gera a entrada.

O ✕ cinza marca exatamente esses momentos: o pavio furou, mas o corpo voltou. Serve para te treinar o olho a **não entrar em faca caindo**.

> **v1.1 corrigiu** a detecção do falso: agora ele é medido contra o lado real onde o preço estava fechando, não apenas contra o candle imediatamente anterior. Menos ✕ falsos, mais fiéis ao que o Bruno mostra.

---

## 3. O painel (tabela)

Sete linhas, pensadas para leitura rápida no meio da operação.

| Linha | Mostra | Como ler |
|---|---|---|
| **Estado** | `LONG ▲` / `SHORT ▼` / `FORA ○` | Em que posição o método diz que você deveria estar agora |
| **Zona** | `ACIMA ✓` / `CRÍTICA ⚠` / `ABAIXO ✗` | Onde o preço está em relação às duas SMAs (ver abaixo) |
| **Último** | `AMA ↑` ou `AMA ↓` + nº de candles | Qual foi o último rompimento da amarela e há quantos candles ocorreu |
| **Força** | `FORTE ◆` / `TÍMIDO ◇` | A força **do rompimento que gerou a posição atual** |
| **Dist.W** | `+1.20%` | Distância % do preço até a SMA **branca** |
| **Dist.Y** | `+3.40%` | Distância % do preço até a SMA **amarela** |

### As 3 zonas (regra visual do Bruno)

- **ACIMA ✓** — preço acima da branca **e** da amarela → tendência de alta intacta, segure o long.
- **CRÍTICA ⚠** — preço **entre** as duas médias → zona de indecisão. O Bruno ensina: **não entre aqui**, espere a definição.
- **ABAIXO ✗** — preço abaixo da branca **e** da amarela → tendência de baixa, segure o short (ou fique fora).

### Força (◆ / ◇) — a "dica importante" do Bruno

No vídeo: *"se o rompimento é com força, mais certo ainda"*. E ele descreve o oposto — um rompimento *"bem tímido"*, quase colado na linha, que é menos confiável.

- **FORTE ◆** = o candle do rompimento tinha corpo grande (acima da média) **e** fechou a uma distância saudável da amarela.
- **TÍMIDO ◇** = corpo pequeno **ou** fechou quase em cima da linha.

Não é garantia de lucro — é só a leitura de quão convincente foi o rompimento, exatamente como o Bruno lê a olho.

---

## 4. Configurações (inputs)

### SMAs
- **SMA Branca (rápida)** — padrão **8**. É a média que avisa primeiro.
- **SMA Amarela (tendência)** — padrão **21**. É a média que decide entrada/saída.

### Exibição
- **Sinais da Branca** — liga/desliga as setas pequenas de alerta antecipado.
- **Falsos rompimentos (✕)** — liga/desliga os ✕. Desligue se quiser o gráfico mais limpo.
- **Painel** — liga/desliga a tabela.
- **Posição do painel** — os 4 cantos da tela.
- **Tamanho do painel** — **WEB** (padrão, compacto para monitor) ou **Celular** (maior e mais legível na tela pequena). Escolha conforme onde você vai operar.

### Força do Rompimento
- **Lookback corpo médio** — padrão **14**. Quantos candles usar para calcular o "corpo médio" de referência.
- **Corpo > Nx média = FORTE** — padrão **1.5**. Quão maior que a média o corpo precisa ser para contar como forte.
- **Dist < N% da amarela = TÍMIDO** — padrão **0.3%**. Se o candle fecha a menos que isso da amarela, é tímido mesmo com corpo grande.

---

## 5. Alertas

Cinco alertas prontos para configurar no TradingView (sino → adicionar alerta → condição = ES B&A):

- **Rompeu Amarela ↑** — sinal de LONG
- **Rompeu Amarela ↓** — sinal de SHORT
- **Rompeu Branca ↑** — alerta antecipado de alta
- **Rompeu Branca ↓** — alerta antecipado de baixa
- **Falso Rompimento** — tocou a amarela mas não confirmou

---

## 6. Fluxo de uso (passo a passo, como o Bruno opera)

1. Abra o ativo no **gráfico de 2 horas**.
2. Espere uma **▲ verde grande** (ou **▼ vermelha grande**) — é o rompimento confirmado da amarela.
3. Confira no painel: **Zona** está a favor? **Força** é FORTE?
4. Entre na direção do sinal. (Preço, alavancagem e stops: assunto separado, já combinado.)
5. **Segure** enquanto o painel mostrar o mesmo Estado e a amarela não for rompida.
6. Quando aparecer a seta grande **contrária**: **saia e entre na contrária** (flip).
7. Ignore os **✕** e as setas pequenas isoladas — elas são contexto, não ordem.

---

## 7. O que este indicador NÃO faz (por design)

Fiel ao vídeo, ele **não** tem: ADX, PST (Pivot SuperTrend), Fibonacci, filtro de volume, filtro de bias de outro timeframe, scalp, índice de confiança, índice de mercado, nem cálculo de stop/gain. O Bruno diz no próprio vídeo que volume e o resto "vocês vão aprender nos Sinais Milionários". Aqui é só o esqueleto: **rompimento da SMA com fechamento de candle**. Simples e aplicável, do jeito que ele ensina.

---

## 8. Aviso honesto

Os sinais mostram **onde o método manda entrar e sair** — não a probabilidade de lucro. Um rompimento FORTE pode falhar; um TÍMIDO pode dar certo. O indicador organiza a leitura que o Bruno faz a olho e mantém a **disciplina** (não entrar em falso, não sair por emoção, segurar enquanto a amarela sustentar). O resultado depende da gestão de risco e da execução — que é você.

---

*Versão do guia: v1.1 · Arquivo do indicador: `ES_RompimentosSMAs_BA_v1_1.pine` · Fonte única: MAC3.0 Como entrar e sair de uma operação (Bruno Aguiar).*

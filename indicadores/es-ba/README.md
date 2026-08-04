# ES_B&A — o indicador de médias do Bruno

**Status: o código ainda não está aqui.** Esta pasta existe para receber e para
registrar o que precisamos saber.

---

## Por que este indicador importa para nós

O `VQ_Pullback` traz a opção **"Mostrar SMAs B&A (desative se ES_B&A na tela)"**,
e ela vem **desmarcada por padrão**. Ou seja: o desenho foi feito para o ES_B&A
plotar as linhas e o nosso indicador só calcular por baixo.

O problema é que **as linhas que aparecem na tela são as dele, e as contas do
painel são as nossas.** Se os dois usarem tipos de média diferentes, existe um
descasamento silencioso.

O que depende dessas médias no VQ_Pullback:

| Campo | Depende de |
|---|---|
| **Balizador** (SEGURE / ATENÇÃO / ENFRAQUECENDO) | branca vs amarela, e preço vs branca |
| **Impulso / direção do Fibonacci** | branca vs amarela (é a mesma condição do balizador) |
| **Score — fator 4** | preço tocando a amarela e fechando do lado certo |
| **Stop AMA** (distância até a amarela) | amarela |
| **Qualidade do PPB-ec** (BOM / ÓTIMO) | preço vs branca vs amarela |

Numa lateralização SMA e EMA praticamente coincidem. **Numa virada rápida a EMA
reage antes** — e é exatamente aí que o painel pode dizer "SEGURE ✓" enquanto a
linha que você está olhando na tela já cruzou. Ou o contrário.

Não é erro de programação. É o tipo de divergência que só aparece nos momentos
de decisão, que são justamente os que importam.

## O que o VQ_Pullback usa hoje

Todas **simples** (`ta.sma`), nenhuma exponencial:

| Variável | Tipo | Período | Fonte |
|---|---|---|---|
| `smaW` (branca, rápida) | SMA | 8 | `close` |
| `smaY` (amarela, tendência) | SMA | 21 | `close` |
| `sma200` (parede) | SMA | 200 | `close` |

---

## O que precisamos do ES_B&A

**Melhor caso:** o arquivo `.pine` nesta pasta. Aí a comparação é linha a linha
e não sobra dúvida.

**Se for um indicador protegido** (invite-only ou fechado do Bruno), o código
não fica acessível — e aí basta um **print da aba de ajustes (Inputs)**, ou as
respostas abaixo:

- [ ] A média **branca** é SMA, EMA, WMA ou outra? Qual período?
- [ ] A média **amarela** é SMA, EMA, WMA ou outra? Qual período?
- [ ] Existe uma terceira média (tipo SMA200)? Qual tipo e período?
- [ ] A **fonte** é `close`, ou é `hl2` / `ohlc4` / outra?
- [ ] Ele plota mais alguma coisa que o VQ_Pullback também calcula?

O item da **fonte** parece detalhe e não é: uma EMA de 8 sobre `hl2` e uma sobre
`close` são linhas diferentes, e a segunda pergunta quase nunca é feita.

## O que fazemos com a resposta

- **Se for SMA 8/21 sobre close** → está tudo coerente, nada a fazer.
- **Se for EMA** → trocar `ta.sma` por `ta.ema` nas linhas 118 e 119 do
  `VQ_Pullback_v1_9.pine`. São duas linhas. **Mas exige recriar os alertas no
  TradingView**, então vale juntar com outra alteração pendente numa passada só.
- **Se os períodos forem outros** → basta ajustar os inputs no gráfico, sem
  tocar no código: `smaWLen` e `smaYLen` já são configuráveis.

⚠ **Não trocar "no escuro" achando que EMA é melhor.** Ela não é melhor nem
pior: é mais rápida e mais ruidosa. O que vale aqui não é a escolha teórica —
é o painel calcular sobre a mesma linha que o trader enxerga.

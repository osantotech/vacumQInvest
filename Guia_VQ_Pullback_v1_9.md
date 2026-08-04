# Guia Completo — VQ Pullback v1.9

**Para quem nunca operou e quer entender CADA coisa que aparece na tela.**
Leia com calma. Nada aqui é decisão automática — o indicador te dá *informação organizada*; a decisão de entrar e sair continua sendo sua.

> **O que mudou da v1.8 para a v1.9**
> - **Drone** (novo): o painel passa a mostrar o que o gráfico de 2h está dizendo, sem você trocar de timeframe. Ver seção 3.
> - **Aviso de estrutura corrigido:** na v1.8 ele travava. Uma vez formado um topo menor, o painel exibia "TOPO MENOR ⚠ saída" até o próximo flip, mesmo que o preço fizesse topos maiores depois. Agora ele volta a dizer "topos/fundos OK ✓" quando a estrutura se recompõe.
> - **"Corpo forte" tinha duas definições** (1,2× e 1,5× o corpo médio). Aparecia o ✕ de rejeição na tela sem o Score subir. Agora é um só valor, ajustável.
> - **ESTATÍSTICAS reescritas.** Elas tinham cinco vieses, todos inflando o resultado para o mesmo lado. O acerto exibido caiu de 35% para **17,6%** — o número não piorou, a medição é que era otimista. Leia a seção 7 antes de usar essa tabela para qualquer decisão.

---

## 1. O que esse indicador faz (em uma frase)

Ele acompanha a tendência pela **Pivot SuperTrend (PST)**, avisa quando o preço **rompe**, **corrige (pullback)** e **retoma**, e desenha o **Fibonacci/OTE** do impulso que você está operando — tudo dentro do método do Bruno Aguiar (MAC / 7M / Águia Spread).

Ele NÃO é um robô que compra e vende sozinho. Ele é um **painel de leitura**: te mostra em que fase o mercado está, se a estrutura está a seu favor, quanto você já ganhou (spread), e onde ficam as zonas importantes.

**Regra de ouro do método (Bruno):** o Fibonacci/OTE é *contexto* — ele NÃO cria o sinal de entrada. A entrada de verdade vem dos sinais **ED / PBv / PPB-ec** (explicados adiante).

---

## 2. Como o indicador "pensa" — o ciclo

Todo movimento passa por fases. O indicador segue esta ordem:

**ROMPIMENTO → PULLBACK → FIM DO PULLBACK → PÓS-PULLBACK → SEGURE → (vira pro outro lado)**

- **Rompimento:** o preço estoura uma região e a PST vira de lado (de baixa pra alta, ou vice-versa).
- **Pullback:** o preço "respira" — corrige um pouco contra o movimento.
- **Fim do pullback:** a correção perde força.
- **Pós-pullback:** o movimento original retoma, confirmado.
- **Segure:** você mantém a posição enquanto a estrutura estiver a favor.

O painel te diz, a cada momento, em qual dessas fases você está.

---

## 3. O PAINEL PRINCIPAL (caixa "VQ Pullback v1.9")

É a caixa com o nome do indicador no topo. Linha por linha:

### Estado
Em que lado você está, segundo a PST:
- **LONG ▲** (verde) = comprado / apostando na alta.
- **SHORT ▼** (vermelho) = vendido / apostando na baixa.
- **FORA** (cinza) = sem posição definida (só no comecinho do gráfico).

### Drone (a tendência do gráfico maior)
O que o gráfico de **2h** está dizendo, lido de dentro do gráfico de 30m.

É o "olhar de drone" do método: o gráfico maior confirma a direção, o menor
executa dentro dela. **Você não precisa trocar de timeframe** — o indicador
continua rodando em 30m e apenas *pergunta* a direção lá em cima.

- **"2h a favor ✓"** (verde) = o gráfico maior está no mesmo lado da sua
  posição. É o cenário em que o método diz para operar.
- **"2h CONTRA ⚠"** (laranja) = os dois discordam. O sinal **continua valendo
  e continua sendo enviado** — mas você está remando contra o drone, e o alvo
  tende a vir menor e a reversão mais cedo.
- **"sem dado ainda"** = o gráfico maior ainda não tem histórico suficiente
  (acontece no começo do gráfico). Não é um aviso; é ausência de resposta.
- **"desligado"** = você desmarcou "Consultar o timeframe maior" nos ajustes.

**Por que não bloqueia?** Porque bloquear apagaria metade do dado. Guardando
os dois grupos, daqui a algumas dezenas de operações dá para responder com
número, e não com opinião, se operar a favor do drone realmente rende mais.
A tela de Resultados faz essa conta sozinha.

**Atraso:** o drone confirma com até 2h de atraso, de propósito. Ele lê a
última vela de 2h **fechada**. Se lesse a vela em formação, o aviso mudaria de
ideia várias vezes dentro da mesma hora — e essa lentidão é justamente a
função de um filtro de tendência.

### Ação
O que fazer *agora*, conforme a fase:
- **"—"** = nada acontecendo.
- **"ROMPEU — aguarde"** = acabou de romper; ainda é cedo, não corra atrás.
- **"ED — entrada direta"** = rompeu com força e não deu pullback; entrada mais imediata (ver seção 4).
- **"PULLBACK — espere a volta"** = está corrigindo; espere a correção terminar.
- **"PBv — virada (agressiva)"** = a correção virou; entrada mais cedo e mais arriscada.
- **"PPB-ec — segura"** = o movimento retomou e confirmou; entrada mais segura. Pode vir com **BOM** ou **ÓTIMO** (qualidade — quanto melhor alinhado com as médias, melhor).

### Spread
Quanto o preço já andou a seu favor desde a entrada (em %), e o **ROE** (retorno sobre a margem, já multiplicado pela alavancagem).
Exemplo: **+7.62% (ROE +152.4%)** = o preço andou 7,62% a seu favor; com 20x de alavancagem, isso vira 152,4% de retorno sobre o que você colocou.
- Verde = a favor. Vermelho = contra.

> **O que é "spread" no método do Bruno:** é o tamanho do movimento que você captura na operação. Não confundir com "spread" de corretora (diferença compra/venda).

### Score
Uma nota de **0 a 5** para a qualidade do pullback. Conta 5 fatores (volume, exaustão, Fibonacci, teste da média, candle de força). A partir de **3/5** o indicador considera o fim do pullback válido. O **✓** aparece quando já passou desse ponto.

> **⚠️ O "Fibonacci" do Score NÃO é a OTE desenhada na tela.** São duas réguas
> diferentes que convivem no indicador:
>
> | | Âncora | Zona |
> |---|---|---|
> | **Fibonacci do Score** (invisível) | topo do rompimento → mínima das 20 velas anteriores | 0.382–0.618 |
> | **Fibonacci/OTE da tela** (seção 5) | pivôs do impulso (força 5) | 0.618–0.786 |
>
> O fator 3 do Score pode marcar "na zona" enquanto o painel exibe
> **"OTE: fora"**. Os dois estão certos, cada um na sua régua — mas **o Score
> não reflete a OTE**. Não espere que subam juntos.

> **Por que o Score raramente passa de 3.** Só o fator de volume 5x é acumulado
> ao longo da correção; os outros quatro precisam acontecer **na mesma vela**.
> E dois deles quase se anulam: "volume abaixo da metade da média" e "candle de
> corpo forte" raramente ocorrem juntos, porque corpo grande costuma vir com
> volume. Na prática o teto é **4**, não 5 — e isso torna PBv e PPB-ec sinais
> estruturalmente raros, com o ED aparecendo muito mais.

### Baliz. (balizador)
Se você pode **segurar** a posição ou se ela está enfraquecendo:
- **SEGURE ✓** (verde) = a média rápida (branca) está do lado certo da lenta (amarela). Estrutura a favor, mantenha.
- **ATENÇÃO ⚠** (laranja) = as médias não estão claramente a favor. Cuidado.
- **LONG enfraq. ⚠ / SHORT enfraq. ⚠** (vermelho) = o preço rompeu a média branca ao contrário da sua posição. Primeiro sinal de fraqueza.

### Estrutura (aviso de saída — regra do Bruno)
Baseado nos topos e fundos. É a regra literal do 7M: *"cruzamento de média não dispara saída; precisa de topo menor (long) ou fundo maior (short) para confirmar."*
- **topos/fundos OK ✓** (verde) = estrutura ainda saudável.
- **TOPO MENOR ⚠ saída** = você está LONG e o preço fez um topo mais baixo que o anterior → a alta pode estar acabando, avalie sair.
- **FUNDO MAIOR ⚠ saída** = você está SHORT e o preço fez um fundo mais alto que o anterior → a queda pode estar acabando, avalie sair.

### OTE (a régua do Fibonacci, no jeito do Bruno)
Diz onde o preço está em relação à zona OTE (a faixa 0.618–0.786 do Fibonacci):
- **"impulso ALTA — fora"** ou **"impulso BAIXA — fora"** = fora da zona; te lembra a direção do impulso.
- **"na OTE — aguarde rejeição"** = o preço entrou na zona; NÃO entre só por estar na zona — espere a rejeição.
- **"Rejeição OTE ✓"** (verde) = o preço entrou na zona e voltou com força (candle de rejeição). Esse é o sinal que o Bruno valoriza.
- **"0.786 rompida ✗ morto"** (vermelho) = o preço passou da 0.786. Pelo método, o setup **morreu** — não force.

### SMA200
Distância do preço até a média de 200 períodos (a "parede" macro). Se estiver a menos de 2% dela, vira **SMA200 ⚠** (laranja) — cuidado, pode bater e voltar.

### Stop AMA
Distância (%) até a média **amarela**. É a opção de **stop apertado** do Bruno (~1%).

### Stop PST
Distância (%) até a linha da **Pivot SuperTrend**. É a opção de **stop largo** do Bruno (~3%).

### Entrada
O preço exato onde a operação começou (de onde o spread é medido). Confira com a linha pontilhada no gráfico.

---

## 4. OS SINAIS NO GRÁFICO (as marcas nas velas)

### ▲ verde (abaixo da vela) / ▼ vermelho (acima da vela)
**Virada da PST.** O triângulo verde = virou para LONG. O vermelho = virou para SHORT. É o rompimento principal, o começo do ciclo.

### PB (bolinha laranja com "PB")
**Início do pullback.** O preço começou a corrigir. Ainda não é hora de entrar — é hora de esperar a correção.

### ED (etiqueta azul)
**Entrada Direta.** O preço rompeu e seguiu com força, sem dar pullback. Entrada mais imediata (e mais agressiva, porque você entra "correndo atrás").

### PBv (etiqueta azul-claro)
**Pullback de Virada.** A correção virou e o movimento original está retomando. É a entrada **mais cedo** — pega mais movimento, mas com mais risco.

### PPB-ec (etiqueta verde)
**Pós-Pullback com Entrada Confirmada.** O preço rompeu o topo/fundo anterior da correção, confirmando a retomada. É a entrada **mais segura**. A cor varia com a qualidade (verde mais forte = melhor alinhamento com as médias).

### ◆ laranja (losango)
**Volume 5x.** Um candle com volume pelo menos 5 vezes o do candle contrário anterior, dentro do pullback e com corpo forte. É a "explosão de volume" que o Bruno usa como pista de reversão da correção.

### TM (triângulo laranja pra baixo, acima da vela)
**Topo Menor.** Você está LONG e apareceu um topo mais baixo. Aviso de saída (ver "Estrutura").

### FM (triângulo laranja pra cima, abaixo da vela)
**Fundo Maior.** Você está SHORT e apareceu um fundo mais alto. Aviso de saída.

### ✕ âmbar (xis pequeno)
**Rejeição na OTE.** O preço tocou a zona OTE e voltou com força. É **contexto**, não é gatilho de entrada — confirma que a zona está "segurando".

### ⚠ vermelho (no alto do gráfico)
**Sinal contra o drone.** Nasceu um sinal de entrada (ED, PBv ou PPB-ec) na
direção oposta à do gráfico de 2h. Aparece no topo da tela, não junto da vela,
para não competir com as marcas de entrada — é um enquadramento do sinal, não
um sinal a mais.

---

## 5. O FIBONACCI / OTE (as linhas horizontais com preços)

Essa é a parte que marca *onde* o movimento pode virar. O indicador detecta o **impulso** (a perna dominante) automaticamente e desenha o Fibonacci nele.

### A linha do impulso + os dois pontos (●)
A linha tracejada diagonal liga o **começo** e o **fim** do impulso. Os dois pontinhos marcam as pontas. **Sua tarefa é bater o olho e confirmar que essa perna é o movimento dominante mesmo.** Se ele ancorar numa perninha errada, a zona inteira fica errada — nesse caso, ajuste a "Força do pivô do impulso" (ver seção 8).

### A direção segue a tendência (branca vs amarela)
- Branca **abaixo** da amarela (baixa) → impulso de **queda** → OTE **acima** do preço, alvos **abaixo**.
- Branca **acima** da amarela (alta) → impulso de **alta** → OTE **abaixo** do preço, alvos **acima**.

> **⚠️ Correção (auditoria de 02/08/2026).** Este guia afirmava que "o desenho
> fica sempre do lado da sua operação". **Não fica.** A direção do impulso vem
> das **médias**; a direção da operação (Estado LONG/SHORT) vem da **PST**. São
> dois sistemas independentes, e eles divergem com frequência — já observado ao
> vivo: SOLUSDT com Estado LONG e os dois alvos desenhados **abaixo** do preço.
>
> **E isso é informação útil, não defeito.** Repare que, num LONG, "branca acima
> da amarela" é exatamente a condição do **Baliz. SEGURE**. Ou seja: sempre que
> o Fibonacci aparecer do lado contrário à sua posição, o balizador já estará em
> ATENÇÃO. São o mesmo aviso, dito em dois lugares da tela.
>
> Fibonacci contra a posição = estrutura de médias contra você. Leia como
> alerta, não como erro do indicador.

### Os níveis
- **1** = onde o impulso começou.
- **0** = onde o impulso terminou.
- **0.382 / 0.5** = correção rasa.
- **0.618 / 0.705 / 0.786** = a zona OTE (a faixa sombreada). É onde a correção "profunda" acontece.
- **0.786 "morte"** (linha vermelha) = o limite. Se o preço passar daqui, o setup morreu.
- **−0.27 / −0.62 "alvo"** (verde) = os alvos, projetados além do fim do impulso.

### Como ler (a régua do Bruno, importante)
1. Correção saudável pousa em **0.382–0.618**.
2. Na zona OTE profunda (**0.618–0.786**), só vale entrar **COM rejeição confirmada** — o preço entra e volta com candle de força. **Tocar não basta** ("comprar faca caindo").
3. Se romper a **0.786**, esqueça — o setup morreu.

> A OTE só *marca a zona*. Quem decide a entrada é você, junto com os sinais ED/PBv/PPB-ec.

---

## 6. O RELÓGIO DE SESSÃO (caixa "SESSÃO")

Mostra quais mercados estão abertos, **no horário do Brasil (UTC-3)**:
- **Ásia (Tóquio) / Londres / Nova York**
- **ABERTO ●** (verde) = mercado funcionando.
- **fechado ●** (vermelho) = fora do horário.

No cabeçalho aparece a **hora atual do Brasil**. Como você opera na Ásia, a linha da Ásia acender verde é seu "farol" de que a sessão que você segue está ativa.

---

## 7. A TABELA DE ESTATÍSTICAS (caixa "ESTATÍSTICAS")

Um mini-backtest que conta, a cada rompimento no histórico do gráfico, se o movimento teria batido Alvo 1/2/3 ou o stop. Serve para **calibrar** — não é promessa de resultado real.

- **N ops** = quantas operações virtuais foram contadas.
- **WR X%** = taxa de acerto (ganhos ÷ total).
- **Ganhos (TP): N  T1:x T2:x T3:x** = quantos venceram, separados pelo alvo mais alto atingido.
- **Breakeven: N** = quantos saíram no zero a zero (empate).
- **Stop: N** = quantos bateram o stop.
- **LONG (g/tot) / SHORT (g/tot)** = ganhos sobre total, separados por direção.

> **Três avisos honestos:**
> 1. É um modelo **simplificado** — valide sempre contra o seu diário de trades.
> 2. Conta só o histórico **carregado no gráfico** — muda ao trocar de timeframe ou recarregar.
> 3. Num sistema de acerto ~50% com R:R alto (que é o do método), **WR baixo não é ruim** — o que importa é os ganhos (T3) renderem mais que os stops. Não olhe o WR isolado.

> **⚠️ Reescrito em 02/08/2026.** A versão anterior desta tabela tinha cinco
> vieses, **todos otimistas**, e os números que ela mostrava eram melhores que a
> realidade:
>
> - abria a operação no **flip da PST**, não nos sinais que você opera (ED/PBv/PPB-ec) — media outro sistema;
> - trade perdedor fechado na virada era contado como **breakeven**, nunca como perda;
> - trade que tocava o Alvo 1 e voltava a zero entrava como **ganho** (ganho de 0%);
> - T1/T2/T3 classificavam pela **maior excursão**, não pelo resultado — subir 8% e fechar em zero contava como T3 e vitória;
> - só olhava o **fechamento**, ignorando todo stop furado no meio da vela.
>
> A versão atual abre no sinal operável, mede pelo pior e melhor preço da barra,
> e classifica pelo **resultado realizado**. Os números ficaram menores — e
> verdadeiros. Se você comparar com prints antigos, a diferença é essa.

---

## 8. OS AJUSTES (o "engrenagenzinha" / settings)

Você não precisa mexer em quase nada. Os que importam:

- **Força do pivô do impulso** (padrão 5): número maior = pega swings maiores (menos ruído); menor = mais sensível. Se o impulso ancorar numa perninha errada, mexa aqui.
- **OTE início / fim** (0.618 / 0.786): a faixa da zona OTE. Deixe como está, é o padrão do método.
- **Sessões** (Ásia/Londres/NY): já vêm nos horários certos no fuso do Brasil.
- **Estatísticas — Stop / Alvo 1/2/3**: os % usados no mini-backtest. Ajuste para bater com o seu plano.
- **Tamanho do painel: WEB / Celular**: **WEB** = tamanho maior/legível no computador; **Celular** = compacto.
- **Posições das caixas**: cada tabela (painel, sessão, estatísticas) pode ir para qualquer canto.
- **Toggles**: dá pra ligar/desligar Fibonacci, aviso de saída, relógio, estatísticas, SMAs, PST, etc. — para deixar a tela limpa.

---

## 9. COMO USAR NA PRÁTICA (o passo a passo do dia)

1. **Defina a direção no gráfico de 2h.** É o timeframe do viés. A PST (Estado LONG/SHORT) e a tendência das médias mandam aqui. (O 4h serve só para volume e Fibonacci.)
2. **Vá para o 30m para executar.** É onde os gatilhos (rompimento, pullback, ED/PBv/PPB-ec) valem para a entrada. A linha **Drone** do painel já traz a resposta do passo 1 para dentro do 30m — mas continue abrindo o 2h de vez em quando: o indicador lê a PST de lá, não lê a estrutura de topos e fundos, e essa parte ainda é olho.
3. **Espere um sinal de entrada:** ED (agressivo, sem pullback), PBv (cedo, agressivo) ou PPB-ec (confirmado, mais seguro). Prefira o PPB-ec enquanto está calibrando.
4. **Use a OTE como confirmação, não como gatilho.** Se o preço estiver rejeitando na zona ("Rejeição OTE ✓"), melhor ainda. Se passou da 0.786, não entre.
5. **Defina o stop:** apertado na amarela (~1%) ou largo na PST (~3%). O painel te dá as duas distâncias.
6. **Segure enquanto "Baliz. SEGURE ✓".** Saia quando aparecer "enfraquecendo", "TOPO MENOR/FUNDO MAIOR", ou o preço romper ao contrário com volume.
7. **Anote no diário.** Todo sinal, mesmo os que você só observou. É a calibração dos 15–20 sinais por ativo.

---

## 10. LEMBRETES QUE SALVAM DINHEIRO

- **O indicador é arma; a gestão é o soldado.** Sem stop disciplinado, indicador bom não ganha.
- **Fibonacci/OTE é contexto, não é entrada.** A entrada vem dos sinais ED/PBv/PPB-ec.
- **Bata o olho no impulso.** Se a perna desenhada não for a dominante, a zona está errada.
- **Não existe setup de 95% de acerto.** Esse número não existe no material do Bruno e é perigoso para dimensionar risco.
- **Espere a rejeição.** Tocar a zona não é sinal. Entrar sem rejeição é comprar faca caindo.
- **"2h CONTRA" não é proibição — é preço.** O sinal contra o drone continua sendo um sinal. Só saiba que você está remando contra a maré: espere alvo menor, reversão mais cedo e menos margem para errar o stop.
- **Você ainda está em modo demo / calibração.** O objetivo agora é observar e anotar, não faturar.

---

*Documento de apoio ao indicador VQ Pullback v1.9. Baseado no método do Bruno Aguiar (MAC 3.0 / 7M / Águia Spread) e nas contribuições do Sandro. Atualize conforme o indicador evoluir.*

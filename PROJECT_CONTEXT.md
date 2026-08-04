# PROJECT CONTEXT — VacumQInvest

> **NUNCA apague este arquivo.** Ao iniciar uma sessão sem contexto, leia-o
> primeiro. Ele descreve o estado real do sistema, não a intenção original.
>
> Última revisão: **03/08/2026** (drone / v1.9 e a medição do "igualou")

---

## 1. O que é

Plataforma de apoio à análise técnica para operar futuros de cripto. Ela **não
executa ordens** e não tem acesso a corretora: recebe os sinais de um indicador
Pine rodando no TradingView, guarda tudo no Supabase, e mostra o histórico com
métricas de resultado e risco.

Produção: https://vacum-q-invest-i4go.vercel.app

## 2. Fluxo real dos dados

```
TradingView (indicador VQ Pullback v1.9)
        │  alert() com JSON
        ▼
POST /api/webhook  ──────► Supabase (alerts / results)
        │                        │
        └──► Telegram            └──► páginas Dashboard, Resultados, Rank
```

Existe também `/api/scanner`, que varre a Binance Futures sozinho e grava em
`scanner_signals`. É o caminho previsto para escalar além do limite de alertas
do TradingView. Está funcional, mas ainda não alimenta `alerts`/`results`.

## 3. O indicador — `indicadores/vq-pullback/VQ_Pullback_v1_9.pine`

O bloco de webhook fica no fim do arquivo. Regras que ele implementa:

- **Uma operação por ciclo de PST.** A entrada é o **primeiro** sinal do ciclo
  (ED, PBv ou PPB-ec); os seguintes são ignorados até o próximo flip. Vários
  sinais por ciclo quebrariam o pareamento entrada/saída que a tela exige.
- **Stop** = linha PST. **Alvos** = extensões Fibonacci −0.27 e −0.62.
- **Saída** por alvo, stop ou flip contrário. Status: TP2, TP1, STOP ou MANUAL.
- **Alvo que já ficou para trás do preço não é enviado** (`null`). Numa ED, o
  rompimento costuma passar das extensões antes do sinal.
- **Correlação com o BTC** via `request.security` + `ta.correlation`, 50 velas.
- **Ticker normalizado**: `SOLUSDT.P` vira `SOLUSDT`, senão o mesmo ativo vira
  duas moedas distintas no banco.
- **Drone (v1.9)**: a mesma PST lida no timeframe maior (padrão 2h), de dentro
  do gráfico de 30m. Ver 8-D.

Configuração por gráfico, no grupo "Webhook VacumQInvest": secret, liga/desliga,
aceitar ED, medir correlação, velas da correlação. O drone tem grupo próprio.

**Alerta no TradingView:** condição = o indicador, "Any alert() function call",
campo Mensagem **vazio**, webhook apontando para `/api/webhook`.

## 4. Páginas e rotas

| Página | O que faz |
|---|---|
| `/` Dashboard | 4 KPIs, curva de capital, últimos sinais, **painel de risco** |
| `/resultados` | tabela das operações fechadas, alavancagem e capitais ajustáveis |
| `/diario` | timeline por ativo com o painel de cada sinal + anotação livre |
| `/rank` | desempenho por ativo, com filtro de mínimo de operações |
| `/config` | perfil, sessão e **gerenciamento de acessos** (só admin) |

| Rota | Autenticação |
|---|---|
| `/api/webhook` | `WEBHOOK_SECRET` no corpo, comparação em tempo constante |
| `/api/scanner` | Bearer `CRON_SECRET` ou sessão |
| `/api/results`, `/api/alerts`, `/api/stats` | sessão |
| `/api/termos`, `/api/avisos`, `/api/diario` | sessão |
| `/api/acessos` | sessão **+ admin**, verificado no servidor |

## 5. Banco (Supabase)

`alerts` · `results` · `telegram_log` · `approved_emails` · `termos_aceite` ·
`avisos_exibidos` · `scanner_watchlist` · `scanner_signals`

Migrations aplicadas: **002** (correlação BTC), **003** (auditoria: termos e
avisos), **004** (coluna admin), **005** (diário: `alerts.painel` jsonb e
`alerts.anotacao`), **006** (drone: `tendencia_htf`, `htf_timeframe`,
`alinhado_htf`). A 001 foi descartada junto com o módulo 3X.

O `painel` guarda o snapshot do indicador no instante do sinal — fase,
balizador, estrutura, OTE, sessões, spread/ROE e as distâncias até SMA200, média
amarela e PST. Valores **semânticos** (`SEGURE`), não o texto da tela
(`SEGURE ✓`): o rótulo muda com o layout, o significado não.

**Acesso administrativo:** dados via `SUPABASE_SERVICE_ROLE_KEY` do `.env.local`
(script `.mjs` precisa rodar da raiz do projeto). DDL via `psql` — a senha está
na **última linha** do arquivo `Senha nova do Supabase - DATABASE`; as duas
primeiras linhas são rótulo e falham a autenticação.

## 6. Acesso de usuários

Login por **e-mail e senha**, sem tela de cadastro. Liberar alguém exige **duas**
coisas: conta no Supabase Auth **e** e-mail em `approved_emails`. Faltando a
primeira, a pessoa não loga; faltando a segunda, ela loga e é desconectada.

A tela em Configurações faz as duas de uma vez. Admin atual:
`ricos@ymail.com`.

## 7. Conformidade

- **Termo de aceite** bloqueante no primeiro acesso, com versão e hash SHA-256
  do texto. Trocar o texto exige **subir a versão** — senão prova-se o aceite
  de um termo revogado. Texto em `src/lib/termo.ts`, versão `0.1-rascunho`.
  **É rascunho de programador e deve ser substituído por advogado.**
- **Trilha de avisos** em `avisos_exibidos`, agregada por usuário/ativo/tipo/dia
  com contador.
- As duas tabelas têm RLS de **leitura apenas das próprias linhas**. Não há
  policy de UPDATE nem DELETE: trilha que o auditado altera não prova nada.
- Os avisos do painel de risco usam **modo descritivo, nunca imperativo**
  ("este stop só caberia até 14x", não "use no máximo 14x"). Recomendar operação
  enfraquece a posição de ferramenta de análise que o termo defende.

## 8. Regras de exibição

- **Percentual nunca aparece sem o denominador.** Sem amostra, mostra `—`, não
  `0,0%` — ausência de dado e resultado zero são coisas opostas.
- **Resultado alavancado tem teto de −100%.** Perda maior que a margem descreve
  uma operação que a corretora já teria liquidado.
- Preço: 2 casas acima de 10, 4 casas entre 1 e 10, casas reais abaixo de 1.

## 8-B. Auditoria do Pine (02/08/2026)

Relatório completo em `indicadores/vq-pullback/AUDITORIA_PINE_v1_8.md` (auditoria da v1.8, corrigida na v1.9). **14 achados.** O que o leitor
futuro precisa saber sem abrir o relatório:

**O que passou:** motor PST fiel ao algoritmo original; **sem repaint nos
sinais** (`ta.pivothigh` gera atraso de confirmação, não reescrita do passado);
**independência de ativo confirmada** — nenhuma comparação de preço contra
constante em 1.000+ linhas; disparo único por ciclo.

**Corrigido:**
- **bug**: o aviso de estrutura (`exitWarn`) nunca se desarmava — ficava em
  "TOPO MENOR ⚠ saída" até o flip, mesmo com a estrutura recomposta;
- "corpo forte" tinha **dois limiares** (1.2× e 1.5×) para o mesmo conceito;
- **ESTATISTICAS reescritas**: tinham cinco vieses somados, todos otimistas —
  abriam no flip em vez dos sinais operados, perda no flip virava breakeven,
  volta a zero após o alvo 1 contava como ganho, T1/T2/T3 classificavam por
  excursão máxima e stops intra-bar eram ignorados. **O WR caiu de 35% para
  17,6%** quando medido honestamente. Se aparecer print antigo com número
  melhor, é a versão enviesada.

**Não corrigido (decisão de método, não erro):** os fatores do score exigem
coincidência na mesma vela; `f2` e `f5` são quase mutuamente exclusivos (teto
prático do score é 4, não 5); o pullback é irreversível e fecha a porta do ED.

**Duas descobertas que valem mais que o código:**

1. **Existem DOIS Fibonaccis.** O do Score (âncora `pbRefHigh`→`swingBase`, zona
   0.382-0.618, invisível) e o da tela (âncora nos pivôs do impulso, zona OTE
   0.618-0.786). O Score **não** reflete a OTE desenhada. O guia tratava os dois
   como a mesma coisa.

2. **Impulso invertido ≡ balizador fraco.** `impDir` vem das médias, `pos` vem
   da PST — e para um LONG, `impDir == -1` é exatamente a condição de
   `balizOK == false`. Quando o Fibonacci aparece contra a posição, é o mesmo
   aviso do balizador, dito noutro canto da tela. O código e o guia afirmavam
   que isso nunca acontecia; ambos foram corrigidos.

## 8-C. O que o "Após o aviso" mede

Linha adicionada na tabela de ESTATISTICAS: guarda o spread no instante do
primeiro aviso de cada operação (enfraquecimento ou topo menor/fundo maior) e
compara com o resultado final.

Primeira leitura real (NEARUSDT 30m, 102 ops): **93 ops · 26 melhoraram ·
média +0,24%**.

**Conclusão:** o aviso aparece em **91% das operações** — não discrimina nada.
E a média positiva **não é estatisticamente significativa** (intervalo de 95%
contém zero). Recomendação vigente: **não usar o aviso como gatilho de
redução**; segurar até stop ou alvo, porque a assimetria (poucos ganhos grandes)
é o que sustenta o sistema.

Isso **inverteu** uma recomendação anterior minha, feita por suposição. Se a
média migrar para −1% ou menos com a amostra maior, reavaliar.

## 8-D. Drone — a tendência do timeframe maior (02/08/2026)

**Origem:** vídeo do Sandro (sócio) lendo um pullback clássico no NEARUSDT 2h.
Ao confrontar a fala dele com o código, apareceu o gap real: **o método usa 2h
para confirmar a tendência e 30m para executar, e o indicador era mono-timeframe
— rodava em 30m sem nenhuma leitura do 2h.**

O único `request.security` do arquivo buscava o BTC com `timeframe.period`, ou
seja, no mesmo timeframe do gráfico. Nada olhava para cima.

**O que foi feito:** a mesma PST, encapsulada em `f_pstDirHTF()` e consultada no
timeframe maior de dentro do gráfico de execução. O gráfico continua sendo 30m e
**o orçamento de 20 alertas do plano Essential não muda** — cada moeda continua
gastando um alerta.

**Sem repaint:** `lookahead_off` **e** o valor da barra HTF anterior (`[1]`).
Sem o `[1]`, a barra de 2h em formação mudaria durante as 4 velas de 30m que a
compõem, e o alerta já disparado passaria a mostrar outra coisa no histórico.
Custo: até 2h de atraso na confirmação — que é a função de um filtro de
tendência, não um defeito.

**Decisão (Ricardo): marca, não bloqueia.** Bloquear apagaria metade do dado, e
sem os dois grupos não há como responder depois, com número, se operar a favor
do drone rende mais. `alinhado_htf` é **booleano nulo** quando indefinido:
"não sei" ≠ "está contra", e confundir os dois contaminaria justamente a
comparação que a coluna existe para permitir.

**A conta ainda não tem resposta.** A tela de Resultados compara as médias dos
dois grupos, mas só declara a amostra conclusiva a partir de **30 de cada lado**.
Antes disso a diferença é ruído — e apresentar ruído como conclusão é o erro
que já inflou a taxa de acerto do indicador uma vez (ver 8-B).

**O que o drone NÃO lê:** apenas a direção da PST de 2h. A estrutura de topos e
fundos do gráfico maior — que é o que o Sandro usa no vídeo para dizer "tende a
alcançar níveis maiores" — continua sendo leitura de olho.

## 8-E. O "igualou" do Sandro — medido e reprovado (03/08/2026)

**A proposta:** o Sandro identifica o fim do pullback quando velas consecutivas
têm o **mesmo extremo** — mínimas alinhadas antes de virar para cima, máximas
alinhadas antes de virar para baixo. No vídeo ele repete três vezes: *"toda vez
que iguala é o momento da virada"*.

Ele marcou os pontos no gráfico (bolinhas azuis nos fundos, linha horizontal
nos topos). O padrão existe e é visível. **A questão era se ele prevê algo.**

**Método:** 1.500 velas de 30m em NEAR, SOL, AVAX e DUSK. Toda vela cujo extremo
ficasse a menos de 5% do ATR do extremo anterior; medida a **direção** (variação
do fechamento) 4, 8, 12 e 20 velas depois.

| Horizonte | fundo alinhado → subiu? | topo alinhado → caiu? |
|---|---|---|
| 2h | −0,016% | +0,035% |
| 4h | −0,045% | +0,029% |
| 6h | −0,068% | +0,036% |
| 10h | −0,087% | +0,061% |

~520 ocorrências de cada. **Nenhum resultado significativo** — os IC de 95% são
duas a três vezes maiores que as médias, e os fundos saem levemente na direção
*contrária* à esperada.

**O número que explica o padrão:** **33,4% de todas as velas** têm um extremo
alinhado com a anterior (tolerância 10% do ATR); **15,1% no mesmo tick exato**.
Uma em cada três. Logo, *sempre* existe um "igualou" perto de qualquer reversão
— basta olhar para trás. É o que torna o padrão convincente no gráfico e inútil
como gatilho isolado. NEAR cota com 4 casas e o ATR vale ~79 ticks: duas velas
repetirem um extremo por acaso é comum, não é informação.

**Por que NÃO virou fator do Score:** um fator que marca 33% das vezes
**facilitaria** atingir o limiar de 3 de 5, e o PBv passaria a disparar mais sem
que a qualidade tivesse mudado. Mais sinais, mesma informação — o tipo de
mudança que parece progresso no gráfico e aparece como prejuízo no extrato.
**Este raciocínio vale para qualquer fator futuro que alguém proponha:** medir a
frequência antes de medir o efeito.

**Limites deste teste — podem inverter a conclusão:**
1. A réplica em JS da máquina de estados é grosseira (não implementa a saída da
   fase 2 por score ≥ 3). "Dentro do pullback" capturou 67-78% das velas, alto
   demais para servir de filtro.
2. O padrão foi testado **isolado**. O Sandro nunca o usa assim — ele já filtrou
   por PST, estrutura, 2h e posição das médias. Pode valer como *timing* depois
   desses filtros, e o teste não cobriria isso.
3. A definição de "igualou" é **nossa** (extremos dentro de X% do ATR). Se para
   ele o alinhamento inclui corpo, volume ou posição, medimos outra coisa.

**Próximo passo acordado:** pedir ao Sandro **15 a 20 casos marcados** (ativo,
timeframe, data e hora). Medir aqueles e comparar com os ~520 encontrados. Se
tiverem algo que os outros não têm, *aquilo* vira a regra — e a regra passa a ser
o que ele de fato usa, não uma aproximação dela.

## 9. Armadilhas já pagas — não repita

1. **Coluna faltando derruba o webhook inteiro** (PostgREST 42703). Já aconteceu
   com `observacao` e `created_at`. **Aplique a migration ANTES do deploy.**
2. **O middleware bloqueava `/api/scanner`** com 307 para `/login`, e o cron
   externo batia numa porta fechada havia semanas sem ninguém notar.
3. **Cron da Vercel no plano Hobby** só aceita frequência diária; `*/15` fez o
   deploy **falhar em silêncio**. O agendamento vive no cron-job.org.
4. **Editar o Pine não atualiza alertas já criados** — o TradingView congela o
   código no momento da criação. Depois de alterar o script, **recrie**.
5. **"Timed out" no TradingView não significa perda de dado.** O timeout é do
   lado dele; o servidor grava. Confirme sempre no painel.
6. **Cold start** custa ~1,2s na primeira chamada. É a causa dos timeouts, não
   o envio do Telegram (esse custa 0,16s — medido).
7. **`alertcondition` só manda texto** e o servidor responde 500. Só `alert()`
   monta JSON.
8. **HTTP 200 do webhook não prova que o deploy subiu.** O código antigo também
   responde 200 — ele apenas ignora o campo novo. A confirmação é consultar a
   coluna no banco, nunca o status da requisição.
9. **Agendador externo desativa job que acumula falha.** A primeira ideia de
   aquecimento (POST com secret inválido, aproveitando o 401 rápido) teria se
   matado sozinha em horas. Por isso o `GET /api/webhook` devolve 200.

## 10. Estado atual e pendências

**Funcionando:** webhook, Telegram (bot `@VacumQI_ricos_bot`, chat privado),
correlação BTC, painel de risco (com seletor isolado/cruzado e aviso de
risco/retorno), diário com snapshot do painel, termo de aceite, trilha de
auditoria, gerenciamento de acessos, ping de aquecimento (`GET /api/webhook`, a
cada 5 min pelo cron-job.org), scanner (responde, mas ainda não grava em
`alerts`).

**10 alertas** armados no TradingView (limite de 20 no plano Essential).

**Duas correções importantes no painel, ambas descobertas olhando a corretora
real do usuário:**
- o cálculo de liquidação assumia **margem isolada**; ele opera **cruzada**,
  onde o saldo inteiro sustenta a posição (medido: liquidação a −74%, não a
  −5%). Hoje há seletor, e no cruzado o aviso é suprimido em vez de inventar
  número;
- nenhuma tela olhava **risco/retorno**. A operação real dele tinha stop −5,01%
  e alvo +2,49% (1 para 0,50), exigindo 67% de acerto para empatar contra um
  histórico de 17,6%. O painel agora calcula o WR necessário.

**Pendente:**
- **Recriar os alertas no TradingView** para a v1.9 (drone). Até isso, os
  alertas armados rodam a versão anterior e chegam com `tendencia_htf` nulo.
- **O "igualou" do Sandro foi medido e NÃO entra como está** — ver 8-E. Não é
  mais falta de parâmetro: é ausência de efeito em ~520 ocorrências, 4 moedas e
  4 horizontes. Pendente é só o passo seguinte: pedir a ele 15-20 casos marcados
  para medir exatamente aqueles.
- **Duas suspeitas levantadas pelo vídeo, ainda não medidas:** (a) a PST chicoteia
  o bastante para resetar a máquina de estados antes de completar 1→2→3→4, o que
  explicaria `4/4 ED`; (b) `phase 1→2` usa `close < brkPrice` — um mergulho que
  fecha acima não conta como pullback, e vira ED duas barras depois. A (b) é
  **decisão de método**, não bug: mexer exige aval do Ricardo e do Sandro.
- Substituir o termo por texto de advogado + política de privacidade (LGPD).
- Ligar o scanner em `alerts`/`results` para escalar às 50+ moedas — o plano
  Essential do TradingView limita a 20 alertas.
- `/api/scanner` sorteia só 10 símbolos por execução (limite de 10s da Vercel);
  com 50 moedas cada uma seria vista uma vez a cada ~75min.
- Comparação de desempenho por tipo de entrada (ED / PBv / PPB-ec). **Adiada de
  propósito**: exige ~30 operações fechadas do tipo mais raro. Antes disso, a
  tela mostraria ruído com cara de estatística.
- O webhook casa a saída só por ativo, sem olhar timeframe. Se a mesma moeda
  rodar em dois timeframes, a saída de um fecha o alerta do outro.
- **O scanner TypeScript não replica o Pine.** `analyzeVQPullback` usa
  cruzamento de SMA 8/21 para detectar o flip; o Pine usa Pivot SuperTrend com
  pivôs e ATR. O score também diverge (SMA8 lá, SMA21 aqui). Ligá-lo em
  `alerts` como está misturaria dois sistemas na mesma tabela, sem forma de
  saber qual linha veio de onde. Antes de escalar pelo scanner, ele precisa ser
  reescrito — ou vale mais subir o plano do TradingView para Plus (100 alertas).
- O bloco `alert()` do Pine dispara só na entrada e na saída. Capturar mudanças
  no MEIO da operação (balizador virando, topo menor surgindo) exigiria alertas
  adicionais, consumindo vagas do limite de 20.
- `backend/` (Python, ccxt, smartmoneyconcepts) existe do desenho original e
  **não está no fluxo atual**.

## 11. Diretrizes

- Sistema quantitativo institucional: nenhum número na tela sem saber de onde
  veio e sobre quantas observações se apoia.
- A plataforma informa; **quem decide é o usuário**. Isso vale para o código e
  para o texto da interface.

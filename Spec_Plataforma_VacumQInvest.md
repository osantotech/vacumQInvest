# VacumQInvest — Spec Técnico Completo
## Plataforma de sinais para 15 usuários | Vercel + Supabase + Telegram
### Versão 1.0 | Julho 2026

---

## VISÃO GERAL

Plataforma web fechada (acesso por login com Google) que recebe alertas automáticos
dos indicadores do TradingView (Entrada e Saída v1.16 + VacumQ Grécia v1.5),
armazena no banco de dados, exibe em tabelas para até 15 usuários autorizados,
e envia notificações simultâneas para um canal privado do Telegram.

**Uso:** pessoal, não-comercial, sem cobrança de assinatura.
**Usuários:** máximo 15, controlados por lista de emails aprovados.
**Custo mensal:** $0 (Vercel Hobby) + $0 (Supabase free) + $14,95 (TradingView Essential).

---

## STACK TECNOLÓGICA

| Camada | Tecnologia | Plano | Custo |
|---|---|---|---|
| Frontend + API | Next.js 14 (App Router) | Vercel Hobby | $0 |
| Banco de dados | Supabase PostgreSQL | Free tier | $0 |
| Autenticação | Supabase Auth + Google OAuth | Incluso | $0 |
| Alertas de entrada | TradingView Essential | Essential | $14,95/mês |
| Notificações | Telegram Bot API | Gratuito | $0 |
| Hospedagem | Vercel (domínio .vercel.app) | Hobby | $0 |

---

## BANCO DE DADOS (Supabase)

### Tabela: `users` (gerenciada pelo Supabase Auth)
```sql
id          uuid PRIMARY KEY
email       text UNIQUE NOT NULL
nome        text
avatar_url  text
created_at  timestamptz DEFAULT now()
```
> Gerenciada automaticamente pelo Supabase Auth.
> Você controla o acesso pela lista de emails aprovados no painel do Supabase.

---

### Tabela: `alerts`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at      timestamptz DEFAULT now()

-- identificação
ativo           text NOT NULL          -- ex: "SOLUSDT"
timeframe       text NOT NULL          -- ex: "30"
indicador       text NOT NULL          -- "Entrada e Saída v1.16" | "VacumQ Grécia v1.5"
direcao         text NOT NULL          -- "LONG" | "SHORT" | "SCALP_SHORT" | "SCALP_LONG"
                                       -- | "SCALP_REALIZE" | "SCALP_STOP" | "FIBO_ROMPEU"
                                       -- | "EXAUSTAO"

-- preços (null para alertas sem preço, ex: exaustão)
preco_entrada   numeric(20,8)
stop            numeric(20,8)
tp1             numeric(20,8)
tp2             numeric(20,8)
tp3             numeric(20,8)

-- índices de qualidade (Entrada e Saída)
confianca_nota  text                   -- "A+" | "A" | "B" | "C" | "D"
confianca_score integer                -- 0-100
mercado_nota    text                   -- "FORTE" | "OK" | "FRACO"
veredito        text                   -- texto do veredito

-- confirmação (VacumQ Grécia)
via_entrada     text                   -- "FIBO" | "FORÇA" | null

-- origem
origem          text DEFAULT 'webhook' -- "webhook" | "manual"
webhook_raw     jsonb                  -- payload original completo do TradingView
```

---

### Tabela: `results`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
alert_id        uuid REFERENCES alerts(id) ON DELETE CASCADE
created_at      timestamptz DEFAULT now()

preco_saida     numeric(20,8) NOT NULL
data_saida      timestamptz NOT NULL
duracao_minutos integer                -- calculado automaticamente

resultado_pct   numeric(10,4)          -- % do preço (ex: 2.75)
resultado_marg  numeric(10,4)          -- % da margem com alavancagem (ex: 55.0)

status          text NOT NULL          -- "TP1" | "TP2" | "TP3" | "STOP" | "MANUAL" | "3X"
observacao      text

telegram_sent   boolean DEFAULT false  -- controle de envio do Telegram de saída
```

---

### Tabela: `telegram_log`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at  timestamptz DEFAULT now()
alert_id    uuid REFERENCES alerts(id)
tipo        text    -- "entrada" | "saida" | "scalp_realize" | "scalp_stop"
status      text    -- "sent" | "error"
error_msg   text
```

---

## API ROUTES (Vercel / Next.js)

### POST `/api/webhook`
Recebe alertas do TradingView, valida o secret, salva no banco e dispara Telegram.

**Payload esperado (configurado no TradingView):**
```json
{
  "secret": "CHAVE_SECRETA_DEFINIDA_POR_VOCE",
  "ativo": "{{ticker}}",
  "timeframe": "{{interval}}",
  "indicador": "Entrada e Saída v1.16",
  "direcao": "LONG",
  "via_entrada": "FIBO",
  "preco_entrada": "{{close}}",
  "stop": "{{plot_0}}",
  "tp1": "{{plot_1}}",
  "tp2": "{{plot_2}}",
  "tp3": "{{plot_3}}",
  "confianca_nota": "A",
  "confianca_score": "85",
  "mercado_nota": "FORTE",
  "veredito": "setup + mercado alinhados"
}
```

**Lógica:**
1. Valida `secret` (rejeita com 401 se inválido)
2. Salva em `alerts` com `origem = 'webhook'`
3. Chama função `sendTelegramEntrada(alert)`
4. Retorna `{ success: true, id: alert.id }`

---

### POST `/api/alerts` (manual)
Mesmo comportamento do webhook, mas chamado pelo formulário da plataforma.
Não exige `secret` (usuário já está autenticado via Supabase Auth).

---

### POST `/api/results`
Salva o resultado de uma operação e dispara Telegram de saída.

**Body:**
```json
{
  "alert_id": "uuid",
  "preco_saida": 87.20,
  "data_saida": "2026-07-15T15:50:00-03:00",
  "status": "TP2",
  "observacao": "saiu no TP2, mercado começou a lateralizar"
}
```

**Lógica:**
1. Busca o alert pelo `alert_id`
2. Calcula `resultado_pct`, `resultado_marg` (usando alavancagem 20x) e `duracao_minutos`
3. Salva em `results`
4. Chama `sendTelegramSaida(alert, result)`
5. Retorna o result salvo

---

### GET `/api/stats`
Retorna os números do dashboard:
```json
{
  "total_alertas": 47,
  "com_resultado": 32,
  "ganhos": 28,
  "stops": 4,
  "win_rate": 87.5,
  "pnl_total_marg": 1240.5,
  "melhor_ativo": "SOLUSDT",
  "alertas_hoje": 3
}
```

---

## TELEGRAM

### Configuração
- Tipo: **Canal privado** (não grupo — só você posta, as 15 pessoas leem)
- Acesso: link de convite que você distribui
- Bot: criado via @BotFather, token salvo como variável de ambiente

### Variáveis de ambiente necessárias
```
TELEGRAM_BOT_TOKEN=xxxx:yyyy
TELEGRAM_CHANNEL_ID=@vacumqinvest  (ou o ID numérico do canal)
WEBHOOK_SECRET=sua_chave_secreta_aqui
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE_KEY=xxxx
```

### Formato — Entrada LONG/SHORT
```
🟢 COMPRE ▲ — SOLUSDT · 30m
━━━━━━━━━━━━━━━━
📊 Entrada e Saída v1.16
💰 Entrada: 82.45
🛑 Stop: 81.22 (-7.2% · 20x)
🎯 TP1: 83.68 · TP2: 85.90 · TP3: 88.12
━━━━━━━━━━━━━━━━
🧠 Confiança: A (85) · Mercado: FORTE
✅ Via FIBO (rejeição da zona)
💬 setup + mercado alinhados
📅 15/jul 09:32 UTC-3
```

### Formato — Entrada SCALP
```
⚡ SCALP SHORT s — SOLUSDT · 30m
━━━━━━━━━━━━━━━━
📊 VacumQ Grécia v1.5
💰 Entrada: 82.45
🛑 Stop: 82.86 (-0.5%)
🎯 Alvo: 81.83 (Modo B-Trilha)
📅 15/jul 10:15 UTC-3
```

### Formato — Saída (manual)
```
✅ ENCERRADO — SOLUSDT · 30m
━━━━━━━━━━━━━━━━
📊 Entrada e Saída v1.16
📥 Entrada: 82.45 · 📤 Saída: 87.20
⏱ Duração: 6h 18min
━━━━━━━━━━━━━━━━
💰 Resultado: +28.5% de margem (20x)
🏆 Status: TP2 atingido
📅 15/jul 15:50 UTC-3
```

### Formato — Scalp Realize (automático)
```
💚 SCALP REALIZOU — SOLUSDT · 30m
━━━━━━━━━━━━━━━━
📊 VacumQ Grécia v1.5
⚡ Spread: +8.4% de margem
⏱ Duração: ~45min
📅 15/jul 11:15 UTC-3
```

### Formato — Scalp Stop (automático)
```
🔴 SCALP STOP — SOLUSDT · 30m
━━━━━━━━━━━━━━━━
📊 VacumQ Grécia v1.5
📉 Resultado: -10.0% de margem
⏱ Duração: ~20min
📅 15/jul 11:05 UTC-3
```

### Formato — Alertas especiais
```
🟣 FIBO ROMPEU — BTCUSDT · 30m
Setup morto. Preço passou do limite 0.786.
📊 VacumQ Grécia v1.5 · 15/jul 08:20 UTC-3

🔴 EXAUSTÃO — ETHUSDT · 30m
5+ velas na mesma direção. Repique provável.
📊 Entrada e Saída v1.16 · 15/jul 14:40 UTC-3
```

---

## PÁGINAS DA PLATAFORMA

### Layout geral
- Menu lateral escuro (padrão Bruno): logo + seções + nome do usuário logado
- Modo escuro por padrão
- Responsivo (funciona no celular)
- Cores: fundo `#131722`, cards `#1e222d`, destaque `#2962ff`

---

### `/` — Dashboard
**Componentes:**
- Donut "Resultados Acumulados" (% Com Lucro / Fazer 3X)
  - Verde = operações que fecharam no lucro diretamente
  - Azul = operações que precisaram do 3X pra virar lucro
- 4 cards de resumo:
  - Total de sinais | Win rate | P&L total de margem | Melhor ativo
- Mini-tabela: últimos 5 alertas com status
- Indicador de status: "🟢 Mercado monitorado" ou "🔴 Sem sinais hoje"

---

### `/sinais` — Sinais ao vivo
**Tabela com colunas:**
| Data | Ativo | TF | Indicador | Direção | Entrada | Stop | TP1 | TP2 | TP3 | Confiança | Mercado | Status |

- Filtros: por indicador, por ativo, por direção, por status (aberto/fechado)
- Status colorido: 🟡 Aberto · ✅ Fechado · 🔴 Stop
- Clique na linha abre modal com todos os detalhes
- Botão "Registrar resultado" aparece nos alertas sem resultado ainda

---

### `/resultados` — Histórico de resultados
**Tabela com colunas:**
| Data Alerta | Data Saída | Ativo | Indicador | Entrada | Saída | % Resultado | Spread 20x | Duração | Status |

- Colunas "Spread 20x" mostram o ganho/perda em % de margem
- Linha verde = ganho · Linha vermelha = stop
- Totalizador no rodapé: P&L acumulado | Win rate | Média de duração

---

### `/scalp` — Resultados do scalp
Igual à página de resultados, filtrado por `direcao IN ('SCALP_SHORT', 'SCALP_LONG')`.

Adicional: card no topo com P&L do dia (igual ao painel do indicador).

---

### `/3x` — Operações 3X
Tabela de registro manual das operações de recuperação 3X.

**Colunas:**
| Data | Ativo | Entrada Original | Entrada 3X | Saída | Resultado | Observação |

Botão "Registrar 3X" abre formulário manual.

---

### `/config` — Configurações
- Nome de exibição (editável)
- Avatar (foto do Google, exibida no menu)
- Notificações (toggle: receber/não receber Telegram — reservado para versão futura)
- Botão "Sair" (logout)

> Nota: só você (admin) pode adicionar/remover usuários, direto no painel do Supabase.

---

## AUTENTICAÇÃO (Google OAuth via Supabase)

### Fluxo
1. Usuário acessa a plataforma → redirecionado para `/login`
2. Clica em "Entrar com Google" → popup do Google
3. Supabase verifica se o email está na lista aprovada
4. Se aprovado → entra na plataforma
5. Se não aprovado → mensagem "Acesso não autorizado. Entre em contato com o administrador."

### Como aprovar usuários
No painel do Supabase → Authentication → Users:
- Você adiciona o email da pessoa (ela recebe convite) **OU**
- A pessoa tenta entrar e você aprova depois no painel

### Proteção de rotas
Todas as páginas exceto `/login` exigem sessão ativa. Middleware do Next.js verifica o cookie do Supabase e redireciona para `/login` se não autenticado.

---

## CONFIGURAÇÃO DOS ALERTAS NO TRADINGVIEW

### URL do webhook (mesma para todos os alertas)
```
https://SEU_PROJETO.vercel.app/api/webhook
```

### Template de mensagem (Entrada e Saída — LONG)
```json
{
  "secret": "SUA_CHAVE_SECRETA",
  "ativo": "{{ticker}}",
  "timeframe": "{{interval}}",
  "indicador": "Entrada e Saída v1.16",
  "direcao": "LONG",
  "via_entrada": "FIBO",
  "preco_entrada": "{{close}}",
  "stop": "{{plot_0}}",
  "tp1": "{{plot_1}}",
  "tp2": "{{plot_2}}",
  "tp3": "{{plot_3}}",
  "confianca_nota": "A",
  "confianca_score": "85",
  "mercado_nota": "FORTE",
  "veredito": "setup + mercado alinhados"
}
```

> Nota: os campos `confianca_nota`, `mercado_nota` e `veredito` precisam ser
> fixos ou pré-definidos por alerta (o TradingView não passa variáveis de Pine
> nesse formato). A solução mais simples: criar um alerta separado por
> combinação relevante, ou usar um texto genérico e complementar visualmente
> na plataforma.

### Template — VacumQ Grécia (LONG)
```json
{
  "secret": "SUA_CHAVE_SECRETA",
  "ativo": "{{ticker}}",
  "timeframe": "{{interval}}",
  "indicador": "VacumQ Grécia v1.5",
  "direcao": "LONG",
  "via_entrada": "FIBO",
  "preco_entrada": "{{close}}"
}
```

### Template — Scalp entrada
```json
{
  "secret": "SUA_CHAVE_SECRETA",
  "ativo": "{{ticker}}",
  "timeframe": "{{interval}}",
  "indicador": "VacumQ Grécia v1.5",
  "direcao": "SCALP_SHORT"
}
```

### Template — Scalp realize
```json
{
  "secret": "SUA_CHAVE_SECRETA",
  "ativo": "{{ticker}}",
  "timeframe": "{{interval}}",
  "indicador": "VacumQ Grécia v1.5",
  "direcao": "SCALP_REALIZE"
}
```

### Template — Fibo rompeu
```json
{
  "secret": "SUA_CHAVE_SECRETA",
  "ativo": "{{ticker}}",
  "timeframe": "{{interval}}",
  "indicador": "VacumQ Grécia v1.5",
  "direcao": "FIBO_ROMPEU"
}
```

---

## ORDEM DE CONSTRUÇÃO (sugerida)

A ordem abaixo minimiza retrabalho — cada etapa adiciona sobre a anterior.

1. **Setup inicial**
   - Criar projeto Next.js + deploy no Vercel
   - Criar projeto Supabase + criar as 4 tabelas
   - Configurar Google OAuth no Supabase
   - Configurar variáveis de ambiente no Vercel

2. **Autenticação**
   - Página `/login` com botão "Entrar com Google"
   - Middleware de proteção de rotas
   - Adicionar primeiro usuário (você) no Supabase

3. **Webhook**
   - Rota `POST /api/webhook`
   - Validação do secret
   - Salvar em `alerts`
   - Testar com Postman/Insomnia antes de ligar no TradingView

4. **Telegram**
   - Criar bot no @BotFather
   - Criar canal privado e adicionar o bot como admin
   - Implementar `sendTelegramEntrada()` e `sendTelegramSaida()`
   - Testar disparo manual

5. **Dashboard**
   - Página `/` com donut e cards de stats
   - Rota `GET /api/stats`

6. **Sinais ao vivo**
   - Página `/sinais` com tabela e filtros
   - Modal de detalhes
   - Formulário "Registrar resultado"

7. **Resultados + Scalp + 3X**
   - Páginas `/resultados`, `/scalp`, `/3x`

8. **Configurações + polish**
   - Página `/config`
   - Responsividade mobile
   - Teste com todos os usuários

9. **Alertas no TradingView**
   - Configurar os alertas do Entrada e Saída v1.16
   - Configurar os alertas do VacumQ Grécia v1.5
   - Verificar chegada no banco e no Telegram

---

## LIMITAÇÕES CONHECIDAS E SOLUÇÕES

| Limitação | Solução |
|---|---|
| Confiança/Mercado/Veredito não passam como variável no webhook | Criar alertas separados por nota, ou complementar manualmente na plataforma |
| Supabase free: 500MB banco | Para 15 usuários com uso leve, não atinge em meses |
| Vercel Hobby: não-comercial | Uso pessoal entre amigos, sem cobrança: dentro dos termos |
| Google OAuth exige app configurado no Google Cloud | Passo único de setup — documentado no Supabase |
| TradingView Essential: 20 alertas técnicos | Suficiente para 2 indicadores × 5 ativos × alertas principais |

---

## CHECKLIST ANTES DE PUBLICAR

- [ ] Secret do webhook definido e salvo como variável de ambiente
- [ ] Google OAuth configurado no Supabase e no Google Cloud Console
- [ ] Bot do Telegram criado e adicionado ao canal
- [ ] Todas as variáveis de ambiente salvas no Vercel
- [ ] Webhook testado via Postman com payload real
- [ ] Telegram testado (mensagem chegando no canal)
- [ ] Login testado com seu email
- [ ] Pelo menos um alerta real do TradingView chegando na plataforma
- [ ] Alertas do TradingView configurados para todos os ativos

---

*Spec criado para construção no Antigravity ou Claude Code.*
*Não iniciar construção sem confirmar variáveis de ambiente e credenciais do Supabase/Google/Telegram.*

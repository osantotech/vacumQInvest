# PROJECT CONTEXT — VacumQInvest

> **NUNCA apague este arquivo.** Ao iniciar uma sessão sem contexto, leia-o
> primeiro. Ele descreve o estado real do sistema, não a intenção original.
>
> Última revisão: **02/08/2026**

---

## 1. O que é

Plataforma de apoio à análise técnica para operar futuros de cripto. Ela **não
executa ordens** e não tem acesso a corretora: recebe os sinais de um indicador
Pine rodando no TradingView, guarda tudo no Supabase, e mostra o histórico com
métricas de resultado e risco.

Produção: https://vacum-q-invest-i4go.vercel.app

## 2. Fluxo real dos dados

```
TradingView (indicador VQ Pullback v1.8)
        │  alert() com JSON
        ▼
POST /api/webhook  ──────► Supabase (alerts / results)
        │                        │
        └──► Telegram            └──► páginas Dashboard, Resultados, Rank
```

Existe também `/api/scanner`, que varre a Binance Futures sozinho e grava em
`scanner_signals`. É o caminho previsto para escalar além do limite de alertas
do TradingView. Está funcional, mas ainda não alimenta `alerts`/`results`.

## 3. O indicador — `VQ_Pullback_v1_8.pine`

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

Configuração por gráfico, no grupo "Webhook VacumQInvest": secret, liga/desliga,
aceitar ED, medir correlação, velas da correlação.

**Alerta no TradingView:** condição = o indicador, "Any alert() function call",
campo Mensagem **vazio**, webhook apontando para `/api/webhook`.

## 4. Páginas e rotas

| Página | O que faz |
|---|---|
| `/` Dashboard | 4 KPIs, curva de capital, últimos sinais, **painel de risco** |
| `/resultados` | tabela das operações fechadas, alavancagem e capitais ajustáveis |
| `/rank` | desempenho por ativo, com filtro de mínimo de operações |
| `/config` | perfil, sessão e **gerenciamento de acessos** (só admin) |

| Rota | Autenticação |
|---|---|
| `/api/webhook` | `WEBHOOK_SECRET` no corpo, comparação em tempo constante |
| `/api/scanner` | Bearer `CRON_SECRET` ou sessão |
| `/api/results`, `/api/alerts`, `/api/stats` | sessão |
| `/api/termos`, `/api/avisos` | sessão |
| `/api/acessos` | sessão **+ admin**, verificado no servidor |

## 5. Banco (Supabase)

`alerts` · `results` · `telegram_log` · `approved_emails` · `termos_aceite` ·
`avisos_exibidos` · `scanner_watchlist` · `scanner_signals`

Migrations aplicadas: **002** (correlação BTC), **003** (auditoria), **004**
(coluna admin). A 001 foi descartada junto com o módulo 3X.

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

## 10. Estado atual e pendências

**Funcionando:** webhook, Telegram, correlação BTC, painel de risco, termo,
trilha de auditoria, gerenciamento de acessos, scanner (respondendo, sem gravar
em `alerts`).

**Pendente:**
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
- `backend/` (Python, ccxt, smartmoneyconcepts) existe do desenho original e
  **não está no fluxo atual**.

## 11. Diretrizes

- Sistema quantitativo institucional: nenhum número na tela sem saber de onde
  veio e sobre quantas observações se apoia.
- A plataforma informa; **quem decide é o usuário**. Isso vale para o código e
  para o texto da interface.

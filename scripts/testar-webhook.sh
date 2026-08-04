#!/usr/bin/env bash
# ============================================================================
#  Testa o webhook do VacumQInvest com o MESMO JSON que o Pine vai mandar.
#
#  Rode ANTES de criar os 9 alertas no TradingView: se o payload estiver certo
#  aqui, está certo lá — o TradingView só entrega a string, não a transforma.
#
#  Uso:  ./scripts/testar-webhook.sh            → grava entrada + saída de teste
#        ./scripts/testar-webhook.sh entrada    → só a entrada
#        ./scripts/testar-webhook.sh saida      → só a saída
#
#  ATENÇÃO: isto escreve no banco de PRODUÇÃO. Usa o ativo TESTEUSDT justamente
#  para a linha ser fácil de achar e apagar depois na tela de Resultados.
# ============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "erro: .env.local não encontrado — rode a partir da raiz do projeto." >&2
  exit 1
fi

SECRET="$(grep -m1 '^WEBHOOK_SECRET=' .env.local | cut -d= -f2- | tr -d '"'"'"' \r')"

if [[ -z "$SECRET" ]]; then
  echo "erro: WEBHOOK_SECRET está vazio no .env.local." >&2
  exit 1
fi

URL="${WEBHOOK_URL:-https://vacum-q-invest-i4go.vercel.app/api/webhook}"
ETAPA="${1:-ambos}"

enviar() {
  local rotulo="$1" corpo="$2"
  printf '\n=== %s ===\n' "$rotulo"
  curl -s -w '\nHTTP %{http_code}\n' -X POST "$URL" \
    -H 'Content-Type: application/json' --data "$corpo"
}

# Mesmo formato que o bloco alert() do VQ_Pullback_v1_9.pine monta,
# incluindo o tp3 ausente (só existem dois alvos: extensões -0.27 e -0.62) e os
# três campos do drone. `alinhado_htf` vai sem aspas de propósito: é booleano
# JSON, e null nele significa "o gráfico maior não respondeu", não "está contra".
if [[ "$ETAPA" == "entrada" || "$ETAPA" == "ambos" ]]; then
  enviar "ENTRADA" '{"secret":"'"$SECRET"'","tipo":"entrada","ativo":"TESTEUSDT","timeframe":"30","indicador":"VQ Pullback v1.9","direcao":"SHORT","via_entrada":"PBv","preco_entrada":"30.99","stop":"31.64","tp1":"30.56","tp2":"30.20","confianca_nota":"A","confianca_score":"4","mercado_nota":"FORTE","veredito":"Score 4/5 · baliz. OK · rejeicao OTE","correlacao_btc":"0.9142","tendencia_htf":"SHORT","htf_timeframe":"120","alinhado_htf":true}'
fi

if [[ "$ETAPA" == "saida" || "$ETAPA" == "ambos" ]]; then
  enviar "SAIDA" '{"secret":"'"$SECRET"'","tipo":"saida","ativo":"TESTEUSDT","preco_saida":"30.56","status":"TP1"}'
fi

cat <<'FIM'

--------------------------------------------------------------------
Esperado: HTTP 200 nas duas, com {"success":true,...}.

  401  → o WEBHOOK_SECRET do .env.local difere do configurado na Vercel
  500  → JSON malformado (ou o erro genérico do catch da rota)
  404  → a saída não achou alerta aberto para o ativo
  409  → já existe saída registrada para esse alerta

Se as duas derem 200, abra /resultados: a linha TESTEUSDT deve aparecer
com +1,39% (SHORT de 30.99 para 30.56) e +27,8% na margem 20x.
--------------------------------------------------------------------
FIM

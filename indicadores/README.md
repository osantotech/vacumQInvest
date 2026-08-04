# Indicadores

Um diretório por indicador, com o `.pine` e a documentação dele juntos. Antes
disso tudo morava na raiz do projeto, misturado com a documentação da
plataforma — e ficava impossível saber, de relance, o que era código de
indicador e o que era código do site.

| Pasta | Indicador | Estado |
|---|---|---|
| `vq-pullback/` | **VQ Pullback v1.9** — o nosso, o que alimenta o webhook | ativo, em produção |
| `modo-grecia/` | **VacumQ Modo Grécia v1.5** | fora do fluxo atual |
| `es-ba/` | **ES_B&A** — as médias do Bruno | código ainda não recebido |

## VQ Pullback — o único que grava no banco

É ele que monta o JSON e dispara o `alert()` para `/api/webhook`. Os outros dois
são de leitura no gráfico e não conversam com a plataforma.

Quem for mexer nele, leia antes:
- `Guia_VQ_Pullback_v1_9.md` — o que cada campo da tela significa
- `AUDITORIA_PINE_v1_8.md` — os 14 achados da auditoria e o que foi corrigido
- `PROJECT_CONTEXT.md` (raiz) — seções 8-B a 8-E

## A regra que mais custou caro

**Editar o `.pine` não atualiza os alertas do TradingView.** O TradingView
congela o código no instante em que o alerta é criado. Alterou o arquivo e colou
no gráfico? Os alertas continuam rodando a versão anterior, em silêncio, e a
tela não tem como avisar.

Toda mudança no Pine exige **apagar e recriar todos os alertas**. Por isso vale
juntar alterações e fazer numa passada só.

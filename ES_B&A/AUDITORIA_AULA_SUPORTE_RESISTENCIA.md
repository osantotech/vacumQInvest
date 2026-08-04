# Auditoria — Aula "R$ 20.000 em minutos" (Bruno Aguiar)

**Data:** 04/08/2026
**Fonte:** transcrição fornecida pelo Ricardo
**Escopo:** o que a aula ensina, o que é testável, o que os dados confirmam e o
que não confirmam.

---

## 1. Onde EU estava errado

A aula descreve uma estratégia **diferente** da que eu vinha testando, e a
diferença muda o resultado.

Eu modelei: *entra no rompimento, inverte no rompimento seguinte, sempre.*
740 operações, esperança −0,109%, soma −80%.

A aula ensina outra coisa, em duas frases explícitas:

> *"O volume está pequeno ainda de compra, **eu não entro**, não confirmou acima
> da amarela, eu não entro."*

> *"**Não quer dizer que você tem que entrar em operações todo santo dia.**"*

Ou seja: **filtrar por volume e não inverter em tudo.** Fui testar:

| Estratégia | Ops | Acerto | Esperança | Soma líquida de taxa |
|---|---|---|---|---|
| A) inverte a cada sinal *(o que eu testava)* | 740 | 24,2% | −0,109% | **−154,3%** |
| B) **só com volume ≥ 2,5×, sai no contrário** | 55 | **45,5%** | **+0,592%** | **+27,1%** |

**A esperança vira positiva.** Não é ajuste fino — é outro sistema.

Ampliando para 8 moedas (63 operações):

```
acerta          42,9%
ganho médio     +2,47%   quando acerta
perda média     −1,18%   quando erra
esperança       +0,385% por operação
frequência      2,8 operações por moeda por MÊS
duração mediana 12 velas (24 horas)
```

**Eu estava medindo a versão errada do método.** O erro foi meu: assumi que
"flip" significava inverter sempre, porque é o que o indicador desenha. A aula
diz que o volume decide se você entra — e o indicador nunca implementou isso
como filtro de entrada.

**Ressalva obrigatória:** n=63, p=0,21. A esperança positiva **ainda não é
estatisticamente significativa**. É promissora, não comprovada. Com 2,8
operações por moeda por mês, chegar a 100 operações leva meses.

---

## 2. O que a aula ensina que os dados CONFIRMAM

**Volume como filtro de entrada.** É o achado central desta auditoria e ele
converge com o que medimos independentemente antes de ler a aula: volume ≥ 2,5×
leva o acerto de 22% para 43%. **O Bruno ensina exatamente isso**, com outras
palavras, e a medição concorda.

**Não operar todo dia.** A frequência da variante B é de 2,8 operações por moeda
por mês. Paciência não é conselho motivacional aqui — é o que produz a esperança
positiva.

**Stop móvel, subindo com a operação.** A aula descreve subir o stop para baixo
da amarela e depois para a 0.50 do Fibonacci. Isso reduz o risco de forma real e
é a base do "Sai se fechar" que o indicador já mostra.

**Congruência de indicadores.** Não entrar só pela amarela: confirmar com
volume, PST e Fibonacci. É a mesma lógica do Score do VQ Pullback.

**Suporte e resistência traçados no gráfico diário.** Não testei (traçar zonas
exige julgamento humano que não automatizei), mas a lógica é sólida e é
informação que nenhum dos nossos indicadores usa hoje. **Fica registrado como
lacuna real.**

---

## 3. O que a aula ensina que os dados NÃO confirmam

### 3.1 As projeções aritméticas

> *"4.200 dólares vezes 20 operações na semana = 84 mil dólares. Vezes 4
> semanas = 336 mil dólares."*

> *"200 mil dólares… 200% = 600 mil. Vezes 10 operações no mês = 6 milhões de
> dólares no mês."*

Estas contas **multiplicam uma operação vencedora pelo número de operações.**
Elas assumem 100% de acerto.

Nos dados, mesmo na melhor variante, **acerta-se 42,9%** — e as perdas custam
−1,18% cada. Uma projeção honesta multiplicaria a **esperança**, não o melhor
caso:

```
projeção da aula      4.200 × 20 × 4  =  336.000
com 42,9% de acerto   esperança real por operação, não o melhor caso
```

Isso não é opinião sobre o Bruno: é a diferença entre `melhor caso × N` e
`esperança × N`. São contas diferentes e dão números muito diferentes.

### 3.2 "Adequar a banca"

> *"Sabe o que é adequar a banca? Colocar capital na sua carteira,
> consistentemente para não ser liquidada. […] Aí eu só coloco no capital, só
> coloco no capital, só coloco no capital."*

Isto tem nome técnico: **aumentar posição perdedora** (*averaging down*). É a
prática que mais destrói contas no mercado, e o motivo é matemático — funciona
todas as vezes até a vez em que não funciona, e essa vez leva tudo.

A própria aula registra o custo emocional: *"essa foi a primeira vez que eu tive
um suor realmente"*. Ele conta o caso em que deu certo. **Não há como saber
quantas vezes daria errado**, porque o caso em que dá errado não vira aula — a
conta acaba.

**Este é o ponto mais perigoso da transcrição para um aluno iniciante.**

### 3.3 A demonstração fora do gerenciamento de risco

> *"Eu entrei totalmente fora do gerenciamento de risco, só para você ver qual é
> a confiança no suporte à resistência."*
> *"É uma coisa que eu não recomendo você fazer nunca."*
> *"Não estou dizendo que faz parte do método você sair do gerenciamento de
> risco."*

**Ele avisa três vezes.** O aviso está correto e é honesto.

O problema é pedagógico, não de honestidade: o aluno vê **US$ 4.200 em minutos**
e um Rolex de R$ 450.000 na mesma aula em que ouve "não faça isso". A imagem
vence o aviso. É o mesmo mecanismo que faz a advertência do maço de cigarro não
funcionar.

### 3.4 O aluno que fez 2,8 milhões

> *"Eu tenho um aluno que fez 2,8 milhões em um único dia."*

Um caso citado não informa nada sem o denominador: **quantos alunos fizeram a
mesma coisa e perderam?** Isso se chama viés de sobrevivência. Não significa que
o caso seja falso — significa que ele não é evidência de nada.

---

## 4. O que a aula NÃO diz — e é o que o Ricardo precisava ouvir

A pergunta que originou esta auditoria foi se a estratégia de **50x com 10
operações por dia** faz sentido, já que 1,21% × 50 = 60,5%.

**A aula diz o contrário disso, em quatro pontos:**

| A aula ensina | A proposta era |
|---|---|
| *"não quer dizer que você tem que entrar em operações todo santo dia"* | 10 operações por dia |
| *"long spread"* — segurar para 300%, 3.000% | girar rápido |
| *"volume pequeno, eu não entro"* | entrar em todo sinal |
| *"gerenciamento de risco é a segurança de que você não será liquidado"* | 50x |

**O Bruno e eu concordamos nos quatro.** A divergência não era entre a minha
análise e o ensino dele — era entre o ensino dele e a extrapolação.

### E a matemática da liquidação não muda com autoridade

Na variante B (a boa), o preço anda contra a posição:

```
metade das vezes passa de   2,41%
1 em cada 10 passa de       3,91%
pior caso                   6,38%
```

Liquidação por alavancagem, nas mesmas 63 operações:

```
 5x  →  0 de 63 liquidadas   (0%)
10x  →  0 de 63              (0%)
20x  →  5 de 63              (7,9%)
30x  → 17 de 63              (27%)
50x  → 51 de 63              (81%)
```

**Com 50x, 81% das operações são liquidadas — inclusive as vencedoras.** O preço
anda 2,41% contra antes de virar a favor em metade dos casos, e 50x liquida a
1,8%. A operação certa morre no caminho.

Simulação com $10, reinvestindo, com taxa:

```
 1x  →  $11,75
 3x  →  $14,66
 5x  →  $16,13   ← melhor resultado
10x  →  $12,18
20x  →  ZEROU
```

**O ponto ótimo é 5x.** Acima disso, a liquidação come mais do que a alavancagem
acrescenta. Isso não é cautela — é onde a curva vira.

---

## 5. Conclusão

**A aula tem conteúdo real e ensina coisas que os dados confirmam.** O filtro de
volume — que é o coração dela — foi o único achado estatisticamente forte de
toda a nossa investigação, e chegamos nele por medição, antes de ler a aula.
Convergência independente conta muito.

**Minha análise anterior estava incompleta**, e a aula expôs isso: eu media
"inverte sempre" quando o método ensina "espera o volume". Corrigido, o sinal da
esperança inverte.

**O que continua valendo:**

1. A esperança positiva é **promissora, não comprovada** (n=63, p=0,21).
2. **5x é o teto útil** de alavancagem para esta estratégia. 50x liquida 81%.
3. As projeções `melhor caso × N operações` não descrevem o resultado esperado.
4. "Adequar a banca" é aumentar posição perdedora e não deve ser praticado.

**O que muda no projeto:**

- O ES_B&A deve ganhar um modo que **só marque as entradas com volume
  confirmado** — hoje ele desenha todas com o mesmo peso.
- Suporte e resistência do gráfico diário é uma **lacuna real** em todos os
  nossos indicadores.

---

*Auditoria de leitura e medição. Nenhum `.pine` foi alterado por conta dela.*

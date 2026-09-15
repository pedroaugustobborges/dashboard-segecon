# Memorial de Cálculo — SEGECON

> Referência técnica de todos os indicadores, scorecards e gráficos do dashboard.
> Todos os nomes de colunas são exatamente como aparecem no banco de dados (`processo_contrato`, `fase1_analise_contrato`).

---

## Tabela de Conteúdo

1. [Fase Atual — Regra de Derivação](#1-fase-atual--regra-de-derivação)
2. [KPI Cards — Visão Geral](#2-kpi-cards--visão-geral)
3. [Lead Time por Fase](#3-lead-time-por-fase)
4. [Lead Time Total do Processo](#4-lead-time-total-do-processo)
5. [Métricas por Fase (páginas de Fase)](#5-métricas-por-fase-páginas-de-fase)
6. [Distribuições de Contagem](#6-distribuições-de-contagem)
7. [Lead Time por Unidade e por Departamento](#7-lead-time-por-unidade-e-por-departamento)
8. [Revisões — Fase 1 Análise Contrato](#8-revisões--fase-1-análise-contrato)
9. [Donuts de Status](#9-donuts-de-status)
10. [Heatmap: Analistas × Fase Atual](#10-heatmap-analistas--fase-atual)
11. [Pictograma: Analistas Reserva](#11-pictograma-analistas-reserva)
12. [Dias na Fase (tabela de Detalhamento)](#12-dias-na-fase-tabela-de-detalhamento)

---

## 1. Fase Atual — Regra de Derivação

**Onde é usado:** Em todos os gráficos, KPIs e tabelas que classificam um processo por fase.

### Lógica (Regra 5.1)

Para cada processo em `processo_contrato`:

1. Se `solicitacao_cancelada = TRUE` → status = **Cancelado** (sem fase atual).
2. Percorre as 8 fases em ordem crescente. Para cada fase N:
   - Se `faseN_data_inicio_<desc>` está preenchido **E** `faseN_data_fim_<desc>` é nulo → a fase N é a **fase atual**.
3. Após o loop: se nenhuma fase está "aberta" E `fase8_data_fim_publicacao_contrato` está preenchido → status = **Concluído** (fase 8).
4. Se nenhum `data_inicio` está preenchido → status = **Pendente**.

### Colunas de Fase (início e fim)

| Fase | `data_inicio` | `data_fim` |
|------|---------------|------------|
| 1 — Análise / Aprovação SC | `fase1_data_inicio_sc` | `fase1_data_fim_sc` |
| 2 — Preparação Cotação | `fase2_data_inicio_prep_cotacao` | `fase2_data_fim_prep_cotacao` |
| 3 — Cotação | `fase3_data_inicio_cotacao` | `fase3_data_fim_cotacao` |
| 4 — Análise Cotação | `fase4_data_inicio_analise_cotacao` | `fase4_data_fim_analise_cotacao` |
| 5 — Aprovação Contrato | `fase5_data_inicio_aprovacao_contrato` | `fase5_data_fim_aprovacao_contrato` |
| 6 — Assinatura Contrato | `fase6_data_inicio_assinatura_contrato` | `fase6_data_fim_assinatura_contrato` |
| 7 — Validação Anexos | `fase7_data_inicio_validacao_anexos_contrato` | `fase7_data_fim_validacao_anexos_contrato` |
| 8 — Publicação | `fase8_data_inicio_publicacao_contrato` | `fase8_data_fim_publicacao_contrato` |

### Pseudocódigo

```
SE solicitacao_cancelada = TRUE → Cancelado

PARA N de 1 a 8:
  SE faseN_data_inicio != NULL E faseN_data_fim = NULL:
    fase_atual = N

SE fase_atual = NULL E fase8_data_fim_publicacao_contrato != NULL → Concluído
SE fase_atual = NULL E fase8_data_fim = NULL → Pendente
SENÃO → Em Andamento na fase_atual
```

---

## 2. KPI Cards — Visão Geral

### 2.1 Processos Ativos

> Contagem de processos que **não** foram cancelados e que possuem pelo menos uma fase em andamento (derivados como `status = 'in_progress'` pela regra 5.1).

$$\text{Ativos} = \left| \{ p \in P \mid p.\texttt{solicitacao\_cancelada} = \text{FALSE} \;\wedge\; \text{faseAtual}(p) \neq \text{NULL} \;\wedge\; \text{status}(p) \neq \text{completed} \} \right|$$

### 2.2 Processos Cancelados

$$\text{Cancelados} = \left| \{ p \in P \mid p.\texttt{solicitacao\_cancelada} = \text{TRUE} \} \right|$$

### 2.3 Processos Concluídos

$$\text{Concluídos} = \left| \{ p \in P \mid p.\texttt{solicitacao\_cancelada} = \text{FALSE} \;\wedge\; p.\texttt{fase8\_data\_fim\_publicacao\_contrato} \neq \text{NULL} \} \right|$$

### 2.4 Valor Estimado Total

> Soma do campo `solicitacao_valor_estimado` para todos os processos **não cancelados**.

$$\text{Valor Total} = \sum_{\substack{p \in P \\ p.\texttt{solicitacao\_cancelada} = \text{FALSE}}} p.\texttt{solicitacao\_valor\_estimado}$$

Exibido formatado em BRL compacto (ex.: R$ 12,3 M).

---

## 3. Lead Time por Fase

**Onde é usado:** Gráfico de lead time na Visão Geral e nas páginas de cada fase.

### 3.1 Lead Time de uma Fase (em dias)

Para um processo `p` na fase N:

$$\text{LeadTime}_N(p) = \frac{\texttt{faseN\_data\_fim} - \texttt{faseN\_data\_inicio}}{86\,400\,000} \;\text{(dias)}$$

Arredondado a 1 casa decimal. Descartados se resultado `< 0`.

> Processos **em andamento** (fim nulo) são **contados separadamente** como `inProgressCount` e **excluídos** de todas as estatísticas abaixo.

### 3.2 Estatísticas por Fase

Sobre o vetor `D` de lead times completados, ordenado crescentemente:

| Estatística | Fórmula |
|-------------|---------|
| **Mínimo** | $\min(D)$ |
| **Q1 (1º quartil)** | interpolação linear em $D$ na posição $0{,}25 \cdot (|D|-1)$ |
| **Mediana** | $D[\lfloor|D|/2\rfloor]$ se ímpar; $\frac{D[m-1]+D[m]}{2}$ se par, $m = |D|/2$ |
| **Q3 (3º quartil)** | interpolação linear em $D$ na posição $0{,}75 \cdot (|D|-1)$ |
| **Máximo** | $\max(D)$ |
| **Média** | $\bar{D} = \frac{\sum D_i}{|D|}$, arredondado a 1 decimal |

#### Fórmula de interpolação para quartis

$$Q(q) = D[\lfloor p \rfloor] + (D[\lceil p \rceil] - D[\lfloor p \rfloor]) \cdot (p - \lfloor p \rfloor)$$

onde $p = (|D| - 1) \cdot q$.

---

## 4. Lead Time Total do Processo

**Onde é usado:** Lead Time por Unidade, Lead Time por Departamento (Visão Geral).

### Definição

$$\text{LeadTimeTotal}(p) = \frac{\texttt{fim\_ultima\_fase} - \texttt{fase1\_data\_inicio\_sc}}{86\,400\,000} \;\text{(dias)}$$

Onde `fim_ultima_fase` é o primeiro campo **não nulo** varrido na ordem:

```
fase8_data_fim_publicacao_contrato
fase7_data_fim_validacao_anexos_contrato
fase6_data_fim_assinatura_contrato
fase5_data_fim_aprovacao_contrato
fase4_data_fim_analise_cotacao
fase3_data_fim_cotacao
fase2_data_fim_prep_cotacao
fase1_data_fim_sc
```

> Retorna `NULL` se `fase1_data_inicio_sc` for nulo **ou** se nenhum `data_fim` estiver preenchido (processo ainda sem nenhuma fase concluída).

---

## 5. Métricas por Fase (páginas de Fase)

Para cada página de fase N, os seguintes indicadores são computados sobre o conjunto de processos filtrados.

### 5.1 Atualmente na Fase N

> Processos não cancelados onde `faseN_data_inicio` está preenchido **e** `faseN_data_fim` é nulo.

$$\text{AtualmenteNaFase}_N = \left| \{ p \in P \mid p.\texttt{solicitacao\_cancelada} = \text{FALSE} \;\wedge\; \texttt{faseN\_inicio} \neq \text{NULL} \;\wedge\; \texttt{faseN\_fim} = \text{NULL} \} \right|$$

### 5.2 Entraram na Fase N (histórico total)

> Processos não cancelados que **em algum momento** passaram pela fase N (independente de terem concluído).

$$\text{Entraram}_N = \left| \{ p \in P \mid p.\texttt{solicitacao\_cancelada} = \text{FALSE} \;\wedge\; \texttt{faseN\_inicio} \neq \text{NULL} \} \right|$$

### 5.3 Média de Lead Time da Fase N

$$\overline{LT}_N = \frac{\displaystyle\sum_{\substack{p : \texttt{faseN\_fim} \neq \text{NULL}}} \text{LeadTime}_N(p)}{\left|\{p : \texttt{faseN\_fim} \neq \text{NULL}\}\right|}$$

Apenas processos com fase **concluída** (fim preenchido) entram no cálculo.

### 5.4 Mediana de Lead Time da Fase N

$$\text{Med}_{LT_N} = \text{mediana}\!\left(\{ \text{LeadTime}_N(p) \mid \texttt{faseN\_fim}(p) \neq \text{NULL} \}\right)$$

### 5.5 Distribuição por Prioridade (Atualmente na Fase)

Agrupamento de `AtualmenteNaFase_N` por `solicitacao_tipo`:

$$\text{DistPrioridade}_N(t) = \left|\{ p \in \text{AtualmenteNaFase}_N \mid p.\texttt{solicitacao\_tipo} = t \}\right|$$

Valores possíveis de `solicitacao_tipo`: `Imediata`, `Urgente`, `Programada`.

### 5.6 Lead Time Médio por Prioridade

Para cada tipo `t` de `solicitacao_tipo`, calcula a média de lead time entre os processos **concluídos** da fase N com essa prioridade:

$$\overline{LT}_{N,t} = \frac{\displaystyle\sum_{\substack{p : \texttt{faseN\_fim} \neq \text{NULL} \\ p.\texttt{solicitacao\_tipo} = t}} \text{LeadTime}_N(p)}{\left|\{p : \texttt{faseN\_fim} \neq \text{NULL} \;\wedge\; p.\texttt{solicitacao\_tipo} = t\}\right|}$$

---

## 6. Distribuições de Contagem

### 6.1 Funil de Fases (Visão Geral)

> Para cada fase N, conta os processos **ativos** (em andamento) cuja `faseAtual = N`.

$$\text{Funil}(N) = \left|\{ p \in P \mid \text{status}(p) = \text{in\_progress} \;\wedge\; \text{faseAtual}(p) = N \}\right|$$

### 6.2 Processos por Unidade

> Contagem de processos não cancelados agrupados por `entidade`.

$$\text{PorUnidade}(u) = \left|\{ p \in P \mid p.\texttt{solicitacao\_cancelada} = \text{FALSE} \;\wedge\; p.\texttt{entidade} = u \}\right|$$

### 6.3 Processos por Prioridade

> Contagem agrupada por `solicitacao_tipo`, excluindo cancelados.

$$\text{PorPrioridade}(t) = \left|\{ p \in P \mid p.\texttt{solicitacao\_cancelada} = \text{FALSE} \;\wedge\; p.\texttt{solicitacao\_tipo} = t \}\right|$$

### 6.4 Processos por Departamento

> Contagem agrupada por `solicitacao_departamento`, excluindo cancelados; ordenado decrescente.

$$\text{TopDept}(d) = \left|\{ p \in P \mid p.\texttt{solicitacao\_cancelada} = \text{FALSE} \;\wedge\; p.\texttt{solicitacao\_departamento} = d \}\right|$$

---

## 7. Lead Time por Unidade e por Departamento

### 7.1 Lead Time Médio por Unidade

$$\overline{LT}_{\text{unidade}}(u) = \frac{\displaystyle\sum_{\substack{p : p.\texttt{entidade} = u \\ \text{LeadTimeTotal}(p) \neq \text{NULL}}} \text{LeadTimeTotal}(p)}{\left|\{p : p.\texttt{entidade} = u \;\wedge\; \text{LeadTimeTotal}(p) \neq \text{NULL}\}\right|}$$

Processos cancelados **excluídos**. `LeadTimeTotal` conforme §4.

### 7.2 Lead Time Mediano por Unidade

$$\text{Med}_{LT_u}(u) = \text{mediana}\!\left(\{\text{LeadTimeTotal}(p) \mid p.\texttt{entidade} = u, \;\text{não cancelado}\}\right)$$

O mesmo padrão se aplica a **Lead Time por Departamento**, substituindo `entidade` por `solicitacao_departamento`.

---

## 8. Revisões — Fase 1 Análise Contrato

**Fonte:** Tabela `fase1_analise_contrato` (join pela chave `id_controle_sc`).

### 8.1 Número de Revisões por Processo

Para cada processo identificado por `id_controle_sc`, conta-se os valores distintos de `nro_revisao`:

$$\text{Revisoes}(p) = \left|\{ r.\texttt{nro\_revisao} \mid r \in \texttt{fase1\_analise\_contrato}, \; r.\texttt{id\_controle\_sc} = p.\texttt{id\_controle\_sc} \}\right|$$

### 8.2 Distribuição em Buckets

Os processos são agrupados em faixas:

| Bucket | Condição |
|--------|----------|
| 0 revisões | $\text{Revisoes}(p) = 0$ |
| 1 revisão | $\text{Revisoes}(p) = 1$ |
| 2 revisões | $\text{Revisoes}(p) = 2$ |
| 3 revisões | $\text{Revisoes}(p) = 3$ |
| 4+ revisões | $\text{Revisoes}(p) \geq 4$ |

### 8.3 Média de Revisões

$$\overline{\text{Rev}} = \frac{\displaystyle\sum_{p} \text{Revisoes}(p)}{\left|P_{\text{na fase 1}}\right|}$$

---

## 9. Donuts de Status

### 9.1 Status Análise Contrato

> Agrupamento de processos **não cancelados** por `fase1_status_analise_contrato`.

$$\text{StatusAnalise}(s) = \left|\{ p \in P \mid p.\texttt{solicitacao\_cancelada} = \text{FALSE} \;\wedge\; p.\texttt{fase1\_status\_analise\_contrato} = s \}\right|$$

### 9.2 Status Aprovação Solicitação

> Agrupamento por `fase1_status_aprovacao_solicitacao`, processos não cancelados.

$$\text{StatusAprovacao}(s) = \left|\{ p \in P \mid p.\texttt{solicitacao\_cancelada} = \text{FALSE} \;\wedge\; p.\texttt{fase1\_status\_aprovacao\_solicitacao} = s \}\right|$$

### 9.3 Status Cotação (Fase 3)

> Agrupamento por `cotacao_status` para processos que **entraram** na fase 3 e não foram cancelados.

$$\text{StatusCotacao}(s) = \left|\{ p \in P \mid p.\texttt{solicitacao\_cancelada} = \text{FALSE} \;\wedge\; p.\texttt{fase3\_data\_inicio\_cotacao} \neq \text{NULL} \;\wedge\; p.\texttt{cotacao\_status} = s \}\right|$$

---

## 10. Heatmap: Analistas × Fase Atual

**Fonte:** Tabela `fase1_analise_contrato` (join `id_controle_sc`), combinada com `processo_contrato`.

### Contagem por célula

Para cada analista `a` e fase `N`:

$$\text{Heatmap}(a, N) = \left|\{ p \mid r \in \texttt{fase1\_analise\_contrato},\; r.\texttt{nome} = a,\; \text{faseAtual}(p) = N,\; \text{status}(p) = \text{in\_progress} \}\right|$$

> Processos **cancelados** e **pendentes** (sem fase atual) são **excluídos** do heatmap.
>
> Isso pode gerar uma divergência intencional com o Pictograma (§11), que inclui todos os status.

A intensidade da célula é proporcional ao valor máximo na linha do analista (normalização por linha).

---

## 11. Pictograma: Analistas Reserva

**Fonte:** Tabela `fase1_analise_contrato_reserva` (colunas: `nome`, `id_controle_sc`).

### Contagem por analista

$$\text{Pictograma}(a) = \left|\{ r \in \texttt{fase1\_analise\_contrato\_reserva} \mid r.\texttt{nome} = a \}\right|$$

> Inclui **todos** os processos vinculados (cancelados, pendentes, em andamento).
> A divergência em relação ao Heatmap é proposital e explicada via tooltip no painel.

---

## 12. Dias na Fase (tabela de Detalhamento)

**Onde é usado:** Coluna "Dias na Fase" na tabela `/processos` (aba Solicitação).

### Processos em andamento

$$\text{DiasNaFase}(p) = \frac{\text{Hoje} - \texttt{faseN\_data\_inicio}}{86\,400\,000}$$

onde `N` é a `faseAtual(p)` derivada pela regra 5.1.

### Processos concluídos ou cancelados

Exibe `—` (não calculado).

---

## Glossário de Colunas Principais

| Coluna | Tabela | Descrição |
|--------|--------|-----------|
| `id_controle_sc` | `processo_contrato` | Chave de controle da solicitação de compra |
| `entidade` | `processo_contrato` | Unidade hospitalar (ex.: HGF, HMIB) |
| `solicitacao_tipo` | `processo_contrato` | Prioridade: `Imediata`, `Urgente`, `Programada` |
| `solicitacao_cancelada` | `processo_contrato` | Flag booleana de cancelamento |
| `solicitacao_valor_estimado` | `processo_contrato` | Valor estimado em R$ |
| `solicitacao_departamento` | `processo_contrato` | Departamento requisitante |
| `fase1_status_analise_contrato` | `processo_contrato` | Sub-status textual da análise |
| `fase1_status_aprovacao_solicitacao` | `processo_contrato` | Sub-status textual da aprovação |
| `cotacao_status` | `processo_contrato` | Status da cotação (Fase 3) |
| `fase8_data_fim_publicacao_contrato` | `processo_contrato` | Data de conclusão do processo |
| `nro_revisao` | `fase1_analise_contrato` | Número de revisão do analista |
| `nome` | `fase1_analise_contrato` | Nome do analista responsável |
| `nome` | `fase1_analise_contrato_reserva` | Nome do analista reserva |

---

*Documento gerado em 2026-09-14. Mantido junto ao código-fonte em `docs/MEMORIAL_DE_CALCULO.md`.*

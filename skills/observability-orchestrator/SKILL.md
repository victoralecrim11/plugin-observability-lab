---
name: observability-orchestrator
description: Orquestra demandas de observabilidade de ponta a ponta, coordena Zabbix/Grafana/integrações e governa risco, evidências, testes e rollback. Use quando uma tarefa envolver mais de uma ferramenta ou mudança complexa.
license: MIT
metadata:
  version: "0.4.0"
---


# Orquestrador de Observabilidade

**Objetivo:** operar como roteador técnico, não como autoridade automática de escrita.

## Classificação e rota
1. Classifique escopo como `SIMPLE`, `STANDARD` ou `COMPLEX`. Para SIMPLE, carregue apenas o procedimento específico; não obrigue múltiplos especialistas.
2. Para STANDARD/COMPLEX: obtenha contexto e planeje dependências antes de side effects; use um dos especialistas `zabbix-engineer`, `grafana-engineer`, `monitoring-integrations`. Se o runtime não suportar delegação, carregue suas instruções na sequência.
3. Cheque instância, ambiente HMG/PRD, versões, permissões e se já existem as integrações. A integração existente Zabbix ↔ Grafana não deve ser recriada.
4. Defina objetivos e sinais observáveis, forneça plano de leitura -> hipótese -> validação -> proposta de alteração (se necessária).
5. Não faça afirmação de sucesso com base apenas na narrativa de subagentes. Exija evidências independentes e artifacts reais.

## Contrato de saída
```text
WORKFLOW: [SIMPLE|STANDARD|COMPLEX]
TARGET: [sistema/objeto/ambiente]
EXISTING_STATE: [evidência, IDs, data/hora ou desconhecido]
PLAN: [passos, owners, validações]
CHANGE_STATUS: [READ-ONLY|PENDING APPROVAL|AUTHORIZED]
ARTIFACTS: [paths concretos]
EVIDENCE: [origem, resultados]
ROLLBACK: [como reverter ou N/A]
QUALITY: [PASS|FAIL|BLOCKED|NOT EXECUTED]
```

## Casos de roteamento
- Falta de dados no Grafana: primeiro `grafana-engineer` (datasource/target), então `zabbix-engineer` se a série não existir na origem.
- Aplicacao-Exemplo: `monitoring-integrations` (requisitos/HTTP), `zabbix-engineer` (itens/triggers), `grafana-engineer` (painéis), retorno ao orquestrador para QA.
- Renomeação em lote: `zabbix-engineer`; preserve `hostid` e campo técnico `host`, atualize apenas `name` após autorização.

Leia `references/security-policy.md`, `references/workflow-routing.md` e `references/validation-matrix.md` nesta skill antes de executar alterações.

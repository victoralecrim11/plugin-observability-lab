---
name: criar-dashboard
description: Gerar dashboard novo para Grafana 12.x usando datasources comprovados.
license: MIT
metadata:
  version: "0.8.0"
---

# /observability:criar-dashboard

**Objetivo:** Gerar dashboard novo para Grafana 12.x usando datasources comprovados.

## Entrada e seleção de contexto
Determine público, KPI, pasta, datasource correto e modelo de painel.

## Passos operacionais
Verifique se métricas/queries existem, proponha painel e variáveis, gere JSON consistente com o formato e plugin disponíveis, sem inventar source UID nem resultados.

## Saída esperada
Entregue JSON, layouts, vínculos necessários, checklist de importação e validação.


## Regras obrigatórias
- **Reutilizar a integração Zabbix ↔ Grafana já existente**; não criar, reinstalar ou trocar datasource sem necessidade comprovada e aprovação.
- Priorizar leitura e descoberta. Não executar escrita em ambiente remoto sem solicitação/autorização explícita para a alteração concreta.
- Antes de modificar algo: identificar instância e ambiente, inspecionar estado, gerar backup/diff, apresentar impacto e rollback; executar somente com autorização.
- Sem ferramentas conectadas ou permissões suficientes: produzir plano/artefato offline e declarar a limitação. Nunca afirmar que uma ação remota foi concluída sem evidência.
- Não registrar tokens, cookies, credenciais, IPs internos sensíveis ou dados pessoais em relatórios, comandos ou arquivos versionados.
- Preservar identidades e referências estáveis (hostid, host técnico, UIDs de dashboards e datasources) salvo alteração explicitamente autorizada.

## Registro de execução
- Fonte de evidência: GUI / API / arquivo local / relato / hipótese.
- Status por ação: `PLANEJADO | EXECUTADO | VALIDADO | BLOQUEADO | NÃO EXECUTADO`.
- Sem alterações silenciosas; solicite confirmação para o conjunto exato de objetos e modificações.

## Critérios de aceitação
- Identificar os objetos envolvidos por ID/UID e demonstrar sua origem, ou declarar o levantamento pendente.
- Qualquer sugestão de mudança deve vir acompanhada de diff, testes e rollback.
- Separar claramente resultado de validação offline de resultado observado no ambiente.
- Encaminhar à especialidade Zabbix, Grafana ou Integrações de acordo com a fase da investigação.
- Consultar `references/operational-baseline.md`, `references/security-policy.md` e `references/workflow-routing.md` dentro do plugin, se disponíveis.


## Localização do conhecimento
Resolva references/ e scripts/ citados acima a partir da raiz do plugin, dois níveis acima deste diretório. Consulte também ../observability/SKILL.md para especialidades e governança. A invocação desta operação não autoriza alterações remotas: preserve aprovação específica, backup, diff e rollback.

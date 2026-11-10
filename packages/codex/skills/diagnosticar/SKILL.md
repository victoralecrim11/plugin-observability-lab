---
name: diagnosticar
description: Investigar incidentes multi-camada e encaminhar ao especialista correto.
license: MIT
metadata:
  version: "0.7.0"
---

# /observability:diagnosticar

**Objetivo:** Investigar incidentes multi-camada e encaminhar ao especialista correto.

## Entrada e seleção de contexto
Classifique a falha: coletor, rede, agente, API, datasource, query, transformação, painel ou alerta.

## Passos operacionais
Monte uma linha do tempo, verifique evidências e peça inspeções especializadas de Zabbix, Grafana ou integração conforme o caso. Priorize recuperação segura e impacto no serviço.

## Saída esperada
Devolva causa confirmada ou hipóteses classificadas, checagens reproduzíveis e plano de correção/validação.


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

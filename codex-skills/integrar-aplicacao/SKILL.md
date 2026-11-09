---
name: integrar-aplicacao
description: Onboarding de nova aplicação ao monitoramento existente, sem refazer integração Zabbix/Grafana.
user-invocable: false
license: MIT
metadata:
  version: "0.5.0"
---


# integrar-aplicacao

**Objetivo:** Onboarding de nova aplicação ao monitoramento existente, sem refazer integração Zabbix/Grafana.

## Entrada e seleção de contexto
Identifique dono, serviço, documentação, endpoints reais, componentes, credenciais por secret manager e métricas disponíveis.

## Passos operacionais
Planeje por etapas: inventário, observabilidade funcional, coleta Zabbix/Prometheus, consultas Grafana, alertas, rede/TLS, testes HMG, rollout autorizado PRD. Não presumir endpoints ou namespaces.

## Saída esperada
Entregue matriz requisito→coleta→painel→alerta, artefatos necessários, riscos e aceite.


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

## Documentação e segurança
- Leia as instruções de governança em `references/security-policy.md` e `references/operational-baseline.md` neste diretório.
- Para scripts offline, localize a pasta `scripts/` na raiz do plugin.

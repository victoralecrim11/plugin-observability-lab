# Roteamento operacional

## Entradas
- Pedido simples -> procedimento específico (ex.: `auditar-zabbix`, `renomear-hosts`).
- Problema sem causa definida -> `diagnosticar` -> Zabbix/Grafana/Integrações.
- Novo sistema -> `integrar-aplicacao` -> inventário, seleção do método de coleta, planejamento de dashboard e alertas, HMG.
- Revisão de artefatos -> `validar` (offline). Alteração remota não ocorre sem autorização.

## Especialistas
- `zabbix-engineer`: hosts, visible names, templates, macros, LLD, itens, web scenarios, HTTP agent, API JSON-RPC, triggers.
- `grafana-engineer`: UIDs, dashboards JSON, datasources, queries, painéis, transformations, alerting.
- `monitoring-integrations`: HTTP/auth, Prometheus, Azure IaaS/AKS, TLS, gateways, e-mail/requisitos autorizados.
- `observability-orchestrator`: dependências entre áreas, plano e evidências, riscos e validação.

Uma skill ou agente **não garante** delegação real para outros agentes. Adaptar ao runtime; se não houver recurso de subagentes, executar sequencialmente como agente principal.

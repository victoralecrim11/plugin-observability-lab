# Critérios de homologação

| ID | Caso | Offline | Runtime/ambiente |
|---|---|---|---|
| T01 | 19 procedimentos legíveis e invocáveis | Estrutura | Descoberta de slash commands/skills |
| T02 | 4 skills de domínio | YAML/frontmatter | Ativação por intenção |
| T03 | Dashboards JSON | JSON e UIDs | Importação controlada em HMG |
| T04 | Templates Zabbix | Sanidade estrutural | Importação em HMG |
| T05 | Dois Zabbix datasources | Resolução com mapa | Query real no painel |
| T06 | Hosts visible name | Dry-run CSV, IDs e duplicatas | Aplicação autorizada em HMG |
| T07 | Aplicacao-Exemplo | Checklist sem segredos | Endpoints reais somente autorizados |
| T08 | Produção | Guardrail documentado | Aprovação, backup, rollback e evidência |
| T09 | Zabbix/Grafana indisponíveis | Diagnóstico de bloqueio | Sem escrita e sem afirmação falsa |

Use `PASS`, `FAIL`, `NOT EXECUTED` ou `BLOCKED`. Passar em testes offline não implica homologação das funcionalidades remotas.

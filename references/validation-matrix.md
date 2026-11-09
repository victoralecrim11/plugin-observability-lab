# Matriz genérica de validação

| ID | Cenário | Offline | Homologação externa |
|---|---|---|---|
| T01 | Comandos e skills | Estrutura e nomes | Invocação real no cliente |
| T02 | Templates Zabbix | Sanidade de sintaxe | Importação autorizada |
| T03 | Dashboards Grafana | JSON, IDs e UIDs | Query real e painéis |
| T04 | Múltiplas fontes | Resolução de UID | Origem dos dados |
| T05 | Renomeação de host | Dry-run e conflitos | Verificação de hostid |
| T06 | Nova aplicação | Checklist sem segredos | Endpoints reais autorizados |
| T07 | Mudança em produção | Plano, backup e diff | Aprovação, execução e rollback |
| T08 | Sem ferramentas | Mensagem de bloqueio | Sem alegações de sucesso |

Status permitidos: PASS, FAIL, NOT EXECUTED, BLOCKED.

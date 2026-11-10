---
name: observability
description: Conhecimento e workflows de observabilidade para Zabbix, Grafana, Prometheus e integrações. Use para conectar ou inventariar ambientes, auditar Zabbix, Grafana e datasources, diagnosticar coleta ou painéis sem dados, planejar e criar ou atualizar templates e dashboards, monitorar HTTP, integrar aplicações, renomear hosts, revisar alertas, backups, validações e relatórios. Coordena mudanças autorizadas com evidências e rollback.
user-invocable: false
license: MIT
metadata:
  version: "0.6.0"
---

# Observability Dev Toolkit — conhecimento contextual

Selecione a referência correspondente à intenção do usuário. Leia apenas o necessário.
Todos os caminhos abaixo são relativos ao diretório deste SKILL.md instalado, nunca
ao projeto do usuário. A raiz do plugin fica dois níveis acima deste diretório;
os scripts offline e os agentes declarativos estão nessa raiz.

## Especialidades

| Assunto | Referência |
| --- | --- |
| Coordenação, escopo, evidências e mudança complexa | `references/domains/observability-orchestrator/GUIDE.md` |
| Hosts, templates, itens, triggers, LLD e API Zabbix | `references/domains/zabbix-engineer/GUIDE.md` |
| Dashboards, queries, datasources e Grafana | `references/domains/grafana-engineer/GUIDE.md` |
| HTTP, Prometheus, aplicações e integrações | `references/domains/monitoring-integrations/GUIDE.md` |

Cada guia mantém seu próprio subdiretório references; resolva os caminhos nele
citados relativamente ao guia. Nomes de especialistas em guias antigos indicam
esses papéis e referências, não skills adicionais a procurar no catálogo.

## Procedimentos por intenção

| Intenção | Referência |
| --- | --- |
| Inspecionar uma conexão existente | `references/workflows/conectar-ambiente.md` |
| Inventariar | `references/workflows/inventariar.md` |
| Auditar Zabbix | `references/workflows/auditar-zabbix.md` |
| Auditar Grafana | `references/workflows/auditar-grafana.md` |
| Auditar datasources | `references/workflows/auditar-datasources.md` |
| Diagnosticar um incidente | `references/workflows/diagnosticar.md` |
| Diagnosticar coleta | `references/workflows/diagnosticar-coleta.md` |
| Diagnosticar painel | `references/workflows/diagnosticar-painel.md` |
| Criar template | `references/workflows/criar-template.md` |
| Atualizar template | `references/workflows/atualizar-template.md` |
| Monitorar HTTP | `references/workflows/monitorar-http.md` |
| Criar dashboard | `references/workflows/criar-dashboard.md` |
| Atualizar dashboard | `references/workflows/atualizar-dashboard.md` |
| Integrar aplicação | `references/workflows/integrar-aplicacao.md` |
| Renomear hosts | `references/workflows/renomear-hosts.md` |
| Revisar alertas | `references/workflows/alertas.md` |
| Preparar backup | `references/workflows/backup.md` |
| Validar | `references/workflows/validar.md` |
| Relatar resultados | `references/workflows/relatorio.md` |

Os procedimentos são cópias integrais dos comandos Claude. Seus títulos
`/observability:...` identificam o workflow; Codex e Antigravity executam as
instruções por intenção sem depender de um comando slash. Referências globais
citadas nesses procedimentos ficam em references/ na raiz do plugin.

## Regras comuns

- Inicie por leitura. A seleção automática de conhecimento nunca autoriza escrita.
- Antes de mudanças remotas, confirme objetos, ambiente, backup, diff, autorização
  específica e rollback. Preserve hostid, nome técnico e UIDs.
- Para STANDARD/COMPLEX, leia references/agentic-workflow.md na raiz do plugin.
  Use ROOT_ROUTED quando houver delegação real; caso contrário, aplique os papéis
  sequencialmente e declare a limitação.
- Não reinstale integrações existentes por padrão. Nunca invente endpoints,
  permissões, thresholds, credenciais ou resultados.
- Separe PLANEJADO, EXECUTADO, VALIDADO, NÃO EXECUTADO e BLOQUEADO.

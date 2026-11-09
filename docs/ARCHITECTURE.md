# Arquitetura — Claude Code e Codex

A raiz contém manifestos .claude-plugin/ e .codex-plugin/ para um único plugin distribuído em dois clientes.

O diretório workflows/ é a fonte canônica de 19 procedimentos. O builder scripts/build.mjs gera comandos Claude em commands/ e skills operacionais equivalentes em codex-skills/. Skills de domínio ficam em skills/ e agentes declarativos em agents/.

O plugin não instala Zabbix ou Grafana. Ele inspeciona, diagnostica, planeja e, mediante autorização específica e mecanismos reais de acesso, apoia mudanças com backup e rollback.

O código de build também é utilizado na geração de distribuições adicionais por automações externas; não edite dist/ manualmente. Nenhuma credencial ou instalação corporativa acompanha o pacote.

## Camada Agentic ROOT_ROUTED

Root mantém workflow state e decisão de ferramenta. observability-planner produz plano para STANDARD/COMPLEX, e observability-quality-auditor confirma evidências. Os especialistas observability-zabbix-specialist, observability-grafana-specialist e observability-integration-specialist não presumem escrita nem permissões. Não há dependência de nested delegation. Consulte docs/AGENTIC.md e references/agentic-workflow.md.

Quatro skills de conhecimento possuem user-invocable: false; comandos de alteração possuem disable-model-invocation: true. As 19 skills operacionais Codex preservam acesso técnico, embora o cliente possa ignorar a flag de visibilidade. Os diretórios commands/ e codex-skills/ são derivados da fonte workflows/; não são duas bases de manutenção manual.

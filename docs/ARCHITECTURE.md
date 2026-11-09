# Arquitetura — Claude Code e Codex

A raiz contém manifestos .claude-plugin/ e .codex-plugin/ para um único plugin distribuído em dois clientes.

O diretório workflows/ é a fonte canônica de 19 procedimentos. O builder scripts/build.mjs gera comandos Claude em commands/ e skills operacionais equivalentes em codex-skills/. Skills de domínio ficam em skills/ e agentes declarativos em agents/.

O plugin não instala Zabbix ou Grafana. Ele inspeciona, diagnostica, planeja e, mediante autorização específica e mecanismos reais de acesso, apoia mudanças com backup e rollback.

O código de build também é utilizado na geração de distribuições adicionais por automações externas; não edite dist/ manualmente. Nenhuma credencial ou instalação corporativa acompanha o pacote.

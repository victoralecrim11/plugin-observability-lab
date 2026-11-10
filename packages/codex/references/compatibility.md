# Compatibilidade e documentação

| Componente | Referência | Status |
|---|---|---|
| Zabbix 7.4.x | https://www.zabbix.com/documentation/7.4/en/manual | Versão observada; APIs e templates precisam de teste |
| Grafana 12.x | https://grafana.com/docs/grafana/latest/ | Versão observada; JSON deve ser validado na instância |
| Grafana-Zabbix versao-a-verificar | https://grafana.com/docs/plugins/alexanderzobnin-zabbix-app/latest/ | Versão observada; verificar compatibilidade de função e datasource |
| Agent Skills | https://agentskills.io/specification | Frontmatter e descoberta validados estaticamente |
| Claude Code plugin | https://code.claude.com/docs/en/plugins | Pacote para testar na CLI instalada |
| Codex plugin | https://developers.openai.com/plugins/build/plugins | Pacote para testar no cliente compatível |
| Antigravity | https://antigravity.google/docs/build-plugins | Pacote para validar com `agy plugin validate --strict` |

**Não há garantia de compatibilidade operacional até testes no respectivo runtime e ambiente de homologação.**

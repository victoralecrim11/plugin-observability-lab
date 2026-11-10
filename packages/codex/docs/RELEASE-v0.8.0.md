# 0.8.0 — MCP e conexões persistentes

- Ponte local MCP stdio com autenticação por tokens Zabbix e Grafana, sem dependências npm.
- Assistente Windows com tokens DPAPI fora do plugin; ambiente externo suportado.
- Somente leitura por padrão; importações habilitáveis com escopo e autorização específicos.
- Manifestos próprios para Claude, Codex e Antigravity; mantém 21 operações e router sem duplicações.
- Testes de autenticação sintética, limites, bloqueio de escrita, DPAPI e descoberta MCP no runtime Codex real.
- Nenhum ambiente Zabbix/Grafana real foi alterado. Configure credenciais localmente antes do primeiro uso.

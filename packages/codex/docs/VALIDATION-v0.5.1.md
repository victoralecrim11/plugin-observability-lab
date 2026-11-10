# Validação 0.5.1 — correções de regras Antigravity

Data: 2026-11-09. Escopo: exclusivamente pacote sintético/offline e componentes da CLI.

## Mudanças

- Rules security e agentic-governance agora possuem trigger: always_on e description.
- Validador estático verifica trigger nas regras para evitar descarte silencioso.
- Distribuição Antigravity deixa de carregar .mcp.json, exclusivo do Claude; mcp_config.json continua vazio e sem credenciais.
- Testes de regressão cobrem essas duas condições.

## Evidências necessárias para homologação

1. npm run check da fonte e duas distribuições.
2. agy plugin validate . na distribuição e no clone publicado.
3. agy plugin list com 23 skills, cinco agentes e três regras.
4. Sincronização SOURCE_REVISION igual ao commit do repositório principal.
5. Nenhum teste desta versão altera Zabbix, Grafana ou sistemas externos.

O teste funcional completo de delegação permanece PARTIAL: o Root relatou disparar um subagente, porém não houve evidência do output final do plano. O menu Codex/ChatGPT também continua pendente de validação visual após atualizar o plugin.

Nenhum PASS de sintaxe/CI equivale à homologação funcional do monitoramento.

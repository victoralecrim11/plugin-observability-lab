# Observability Dev Toolkit v0.6.0

O catálogo Codex/ChatGPT passa de 42 entradas potenciais para uma skill contextual.
Os 19 workflows e as quatro especialidades continuam disponíveis por intenção.
O Claude preserva os 19 comandos e suas restrições de invocação.

- Removido codex-skills; conhecimento interno agora é referência, não SKILL.md.
- Marketplace Codex instala packages/codex, sem comandos Claude para migrar como Source Command.
- Antigravity usa a mesma skill, 19 workflows, cinco agentes e três regras.
- Gerador, manifestos e testes verificam paridade e integridade das distribuições.
- Identidade observability-marketplace preservada para evitar falha de atualização.

Atualize o marketplace e reinstale/atualize o plugin pelo gerenciador. Reinicie a
sessão para descarregar a versão anterior. A flag user-invocable é específica do
Claude: o Codex pode exibir a única entrada contextual no catálogo.

Nenhum sistema Zabbix/Grafana foi modificado por esta release.

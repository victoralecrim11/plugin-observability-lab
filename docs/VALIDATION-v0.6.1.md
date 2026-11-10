# Validação v0.6.1 — menu operacional Codex

O pedido de ajuste preserva a deduplicação da v0.6.0 e restaura a seleção
individual dos 19 workflows no Codex, seguindo a organização das imagens.

- Fonte e três distribuições: npm run check PASS, 23/23 testes em cada.
- Pacote Codex: 20 entradas únicas = 19 operações nativas + observability.
- Codex real 0.167.0, perfil isolado: plugin/read e skills/list PASS,
  todas as 20 entradas habilitadas, zero Source Command.
- Nomes reais incluem observability:backup, observability:diagnosticar,
  observability:relatorio e observability:auditar-zabbix.
- Corpo integral e descrição de cada operação comparados à referência canônica.
- Claude: 19 comandos preservados. Antigravity: uma skill contextual preservada.
- Nenhuma configuração de Zabbix/Grafana acessada ou alterada.

A aparência e a ordenação do menu são controladas pelo aplicativo. A evidência
é o catálogo real carregado pelo runtime; não se declara captura visual da UI.

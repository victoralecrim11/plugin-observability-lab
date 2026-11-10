# Escopo de validação v0.7.0

Esta versão adiciona importar-template e importar-dashboard ao catálogo canônico.
Os testes verificam preservação integral dos workflows gerados, presença nos
roteadores, proteção de invocação Claude e descoberta real das entradas Codex.
Os mesmos testes rodam na fonte e nas três distribuições pelo GitHub Actions.

Contagens esperadas: 21 comandos Claude; 22 skills Codex (21 operações e contexto);
uma skill Antigravity com 21 workflows. Zero Source Command.

## Limite da homologação

Importação em servidor Zabbix/Grafana real: NÃO EXECUTADO. O pedido foi implementar
a função no plugin; não foram fornecidos arquivo de importação nem destino concreto
autorizado para alteração. Não se alega validação funcional em produção.

As skills orientam o agente a executar a operação usando ferramentas disponíveis
e permitidas, com leitura prévia, backup/diff, escopo autorizado e readback.
Não são drivers de navegador, clientes autenticados nem concessões de permissão.
Se a ferramenta não existe ou não permite uma etapa, o fluxo declara BLOQUEADO.

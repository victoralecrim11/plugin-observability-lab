# Validação v0.6.0 — 2026-11-10

## Causa observada

Cache v0.5.1: 4 skills de domínio + 19 operações em codex-skills + 19
conversões em .codex-plugin/migrated-command-skills = 42 entradas.
O arquivo migrado de alertas contém name: source-command-alertas. Não foi
uma falha de conectividade. A identidade do marketplace continua estável.

## Evidências locais

| Verificação | Resultado |
| --- | --- |
| npm run check na fonte | PASS, 23 testes |
| npm run check em Claude, Codex e Antigravity gerados | PASS, 23 testes por pacote |
| Comparação byte a byte do pacote Codex publicado | PASS via verify-generated.mjs |
| claude plugin validate . | PASS |
| agy plugin validate dist/antigravity/observability | PASS, 1 skill, 5 agentes, 3 regras |
| Codex app-server 0.167.0 plugin/read | PASS, somente observability:observability |
| Codex app-server 0.167.0 skills/list forceReload | PASS, 1 skill habilitada, 0 Source Command |
| Parser Codex do marketplace git-subdir | PASS, path packages/codex |

O teste real instala o pacote em perfil temporário e consulta os endpoints
utilizados pelo cliente, sem chamada a modelo ou sistema monitorado. Reproduza
com `node scripts/test-runtime-local.mjs /caminho/para/codex`. O GitHub Actions
executa o mesmo teste com Codex 0.166.0, além das validações dos três pacotes.

Isso comprova descoberta real pelo runtime; não é uma captura visual do menu
na janela do desktop. ChatGPT web e invocação funcional de todos os workflows
não foram homologados visualmente. Não há garantia de ocultação da única skill
contextual em interfaces que não implementem a extensão Claude user-invocable.

As 19 referências preservam integralmente a fonte, incluindo os guardrails de
autorização. Testes de mutação rejeitam skill extra e conteúdo divergente.
Nenhum ambiente Zabbix/Grafana foi consultado ou alterado.

## Publicação

CI publica os três pacotes como artefatos; tags v* executam release.yml e
publicam arquivos ZIP após validação. O repositório Antigravity sincroniza
via sync-from-source.yml, registra SOURCE_REVISION e testa antes do commit.
Consulte as execuções do GitHub Actions correspondentes ao commit publicado.

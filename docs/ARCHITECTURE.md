# Arquitetura — v0.7.0

Uma fonte canônica gera três superfícies compatíveis:

| Superfície | Skills | Comandos Claude | Workflows em referências |
| --- | --- | --- | --- |
| Raiz / Claude | 1 model-invoked | 21 | 21 |
| packages/codex (marketplace Codex/ChatGPT) | 22 (21 operações + contexto) | 0 | 21 |
| Distribuição Antigravity | 1 | 0 | 21 |

`workflows/` contém os 21 procedimentos canônicos. `scripts/sync-content.mjs` copia bytes para `commands/` e `skills/observability/references/workflows/`. Não edite cópias. Quatro guias de especialidade preservam seu conhecimento e referências em `skills/observability/references/domains/`. Na fonte e no Antigravity, somente o roteador possui SKILL.md. O pacote Codex gera também 21 SKILL.md nativos a partir dos mesmos workflows, com nomes curtos e corpo integral; não inclui commands/ e não gera Source Command.

`npm run build:sync` regenera manifestos e `packages/codex/`, versionado para instalação direta do GitHub. O marketplace Codex usa source git-subdir, path packages/codex, mantendo observability-marketplace e observability estáveis. O CI compara todos os bytes do pacote publicado com um build novo. `dist/claude-codex/observability` preserva a superfície Claude; não é o destino do catálogo Codex.

## Causa da duplicação

Na v0.5.1, 4 skills de domínio + 19 skills de codex-skills + 19 comandos migrados pelo Codex resultavam em 42. Os migrados eram escritos em .codex-plugin/migrated-command-skills como source-command-*. user-invocable:false é uma extensão Claude e não evitava essa conversão.

O React Dev Hub 1.6.0 fornece o padrão de uma skill model-invoked e conhecimento em referências. Ele ainda inclui comandos na raiz: copiar apenas sua flag não elimina Source Command. Por isso isolamos fisicamente o pacote Codex dos comandos Claude. Os guias internos não usam SKILL.md; o diretório legado codex-skills não é distribuído.

## Compatibilidade e limites

O Claude mantém 21 comandos e a skill contextual oculta no menu slash. Codex/ChatGPT têm 21 operações selecionáveis e uma entrada contextual no catálogo; não prometemos que a interface oculte toda skill model-invoked. Antigravity recebe o mesmo conhecimento contextual, com cinco agentes e três regras. As regras não concedem permissões de execução.

ROOT_ROUTED, aprovação específica, backup, diff, rollback, IDs estáveis e evidências continuam obrigatórios. Não houve acesso ou alteração a ambientes Zabbix/Grafana nesta refatoração.

Referências oficiais: https://developers.openai.com/plugins/build/plugins e https://code.claude.com/docs/en/skills.

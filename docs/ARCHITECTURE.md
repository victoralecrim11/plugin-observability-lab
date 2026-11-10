# Arquitetura — v0.6.0

Uma fonte canônica gera três superfícies compatíveis:

| Superfície | Skills | Comandos Claude | Workflows em referências |
| --- | --- | --- | --- |
| Raiz / Claude | 1 model-invoked | 19 | 19 |
| packages/codex (marketplace Codex/ChatGPT) | 1 | 0 | 19 |
| Distribuição Antigravity | 1 | 0 | 19 |

`workflows/` contém os 19 procedimentos canônicos. `scripts/sync-content.mjs` copia bytes para `commands/` e `skills/observability/references/workflows/`. Não edite cópias. Quatro guias de especialidade preservam seu conhecimento e referências em `skills/observability/references/domains/`. Somente o roteador possui SKILL.md.

`npm run build:sync` regenera manifestos e `packages/codex/`, versionado para instalação direta do GitHub. O marketplace Codex usa source git-subdir, path packages/codex, mantendo observability-marketplace e observability estáveis. O CI compara todos os bytes do pacote publicado com um build novo. `dist/claude-codex/observability` preserva a superfície Claude; não é o destino do catálogo Codex.

## Causa da duplicação

Na v0.5.1, 4 skills de domínio + 19 skills de codex-skills + 19 comandos migrados pelo Codex resultavam em 42. Os migrados eram escritos em .codex-plugin/migrated-command-skills como source-command-*. user-invocable:false é uma extensão Claude e não evitava essa conversão.

O React Dev Hub 1.6.0 fornece o padrão de uma skill model-invoked e conhecimento em referências. Ele ainda inclui comandos na raiz: copiar apenas sua flag não elimina Source Command. Por isso isolamos fisicamente o pacote Codex dos comandos Claude. Nenhum SKILL.md interno nem diretório codex-skills é distribuído.

## Compatibilidade e limites

O Claude mantém 19 comandos e a skill contextual oculta no menu slash. Codex/ChatGPT têm uma única entrada no catálogo; não prometemos que a interface oculte toda skill model-invoked. Antigravity recebe o mesmo conhecimento contextual, com cinco agentes e três regras. As regras não concedem permissões de execução.

ROOT_ROUTED, aprovação específica, backup, diff, rollback, IDs estáveis e evidências continuam obrigatórios. Não houve acesso ou alteração a ambientes Zabbix/Grafana nesta refatoração.

Referências oficiais: https://developers.openai.com/plugins/build/plugins e https://code.claude.com/docs/en/skills.

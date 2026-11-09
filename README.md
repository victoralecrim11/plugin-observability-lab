# Observability Dev Toolkit

Plugin **unificado para Claude Code e Codex** voltado à engenharia de observabilidade com Zabbix, Grafana, Prometheus e integrações HTTP/Cloud. Todos os exemplos são genéricos; não há dados, hostnames, IPs ou credenciais corporativas neste repositório público.

## Instalação no Claude Code

No Claude Code, execute:

    /plugin marketplace add victoralecrim11/plugin-observability-lab
    /plugin install observability@observability-marketplace

Para desenvolvimento local, use o diretório raiz com o comando: claude --plugin-dir .

## Instalação no Codex

O mesmo repositório disponibiliza o manifesto .codex-plugin/plugin.json, quatro skills de domínio em skills/ e dezenove skills operacionais em codex-skills/. Use o método de instalação suportado pela sua versão do Codex.

## Funcionalidades

- 19 procedimentos operacionais: auditoria, diagnóstico, criação e atualização de templates, dashboards, HTTP e governança.
- 4 skills especializadas e 5 agentes declarativos, com uso condicionado às capacidades do runtime.
- Scripts Node.js para validação offline e planejamento de alteração de nomes com dry-run.
- Fonte canônica em workflows/, gerando comandos Claude e skills Codex a partir dos mesmos procedimentos.

## Desenvolvimento

Requer Node.js 20+.

    npm run check
    npm run build

A validação também ocorre no GitHub Actions. O build gera artefatos em dist/ e nunca altera sistemas remotos.

## Segurança

- O comando conectar-ambiente é uma inspeção somente leitura; não instala nem recria integrações.
- Toda alteração exige autorização explícita, backup, diff, testes e rollback.
- Não presuma fonte de dados padrão; identifique o UID correto no painel.
- Nunca inclua tokens, e-mails, hosts ou informações confidenciais no GitHub.

Leia docs/INSTALL.md, docs/ARCHITECTURE.md e references/security-policy.md. Licença MIT.

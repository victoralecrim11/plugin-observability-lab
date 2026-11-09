# Arquitetura agentic e homologação

O contrato de delegação é ROOT_ROUTED e está em references/agentic-workflow.md. A arquitetura é portátil, mas capacidade de subagentes e ferramentas depende do runtime.

Os agentes especializados têm nomes com prefixo observability- para evitar colisão com outros plugins. No Antigravity, mainAgent=false e subagent=true permitem descoberta como subagentes; commandExecutionPolicy=off e inheritMcp=false evitam shell ou MCP não autorizado. Não se usa lista estática tools no frontmatter, pois houve regressão histórica com registro nativo em versões anteriores.

## Comportamento esperado
- Planner não realiza escritas nem marca execução como PASS.
- Root pode pedir análise a especialistas, mas verifica tool evidence antes de declarar sucesso.
- Agentes sem ferramentas devolvem CANONICAL OUTPUT; Root materializa quando autorizado.
- Quality Auditor distingue teste local, teste em ambiente e aprovação de mudanças.
- Quando o runtime não permitir invocar especialistas, fallback SKILL_CHAIN e relatório honesto.

## Testes
1. npm run check na fonte; npm run build; npm run check em cada distribuição.
2. claude plugin validate . na raiz; conferir menu sem as 4 skills de domínio.
3. agy plugin validate . e agy plugin list após instalação isolada.
4. Smoke test de delegação apenas com dados sintéticos: agente planejador recebe cenário offline e responde com DELEGATION PLAN; auditor registra NOT EXECUTED para tudo que não foi executado.
5. Nenhum teste implica autorização para acessar produção.

A validação estática não comprova que o agente foi chamado ou que suas permissões reais coincidem com o frontmatter.

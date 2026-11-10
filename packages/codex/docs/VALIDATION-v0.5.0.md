# Validação 0.5.0 — agentic e controle de skills

Data: 2026-11-09. Escopo: artefatos **sintéticos/offline**. Nenhuma operação em monitoramento externo.

## Checagens realizadas

| Tipo | Resultado | Limite |
| --- | --- | --- |
| Suite Node.js na fonte | PASS — 21/21 | Não confirma runtime de IA |
| Suite na distribuição Claude/Codex | PASS — 21/21 | Não confirma menu do cliente |
| Suite na distribuição Antigravity | PASS — 21/21 | Não confirma tarefas reais de monitoramento |
| Validador Claude Code | PASS | Checa manifesto/marketplace |
| Validador Antigravity | PASS — 23 skills, 5 agents | Checa estrutura dos componentes |
| Instalação local temporária Antigravity | PASS — plugin 0.5.0 carregado | Não comprova integração corporativa |
| Descoberta via plugin list | PASS — 23 skills, 5 agentes, 3 regras | Não comprova injeção de regras na sessão |
| Teste headless com Root e subagente planejador | PARTIAL | Root relatou lançamento do agente com ID, mas não entregou o output do subagente nessa execução |
| Homologação real de dashboards/hosts | NOT EXECUTED | Requer ambiente, permissão e aprovação |
| Menu de skills no Codex/ChatGPT | NOT EXECUTED | A flag de visibilidade pode variar por cliente |

## Correções e evidências

- Skills de domínio ocultas do menu Claude: user-invocable false; ainda disponíveis para seleção automática contextual.
- Oito comandos com potencial de mudança só são invocados explicitamente pelo usuário no Claude.
- Dezenove skills operacionais Codex preservadas; frontmatter de visibilidade não garante ocultação em todos os clientes.
- Agentes com nomes prefixados e responsabilidades separadas entre Root, planner, specialists e quality auditor.
- Antigravity não possui listas fixas tools no frontmatter dos agentes, evitando a regressão histórica de registro de ferramentas.
- commandExecutionPolicy off e inheritMcp false para limitar execução pelo subagente; Root permanece responsável pelos gates.
- ROOT_ROUTED: delegação aninhada não é exigência; sem evidência de escrita, não declarar efeito aplicado.

## Limitações

A execução headless do Root respondeu que iniciara um subagente de planejamento e identificou sua conversa, mas a resposta foi encerrada antes de chegar o DELEGATION PLAN. Portanto, a **delegação ponta a ponta permanece parcial**; revisar no cliente interativo com o painel de agentes antes de declarar homologação.

Os testes são estáticos/offline e não representam autorização nem execução de escrita em Zabbix, Grafana ou qualquer sistema externo.

## Erratum após publicação

A validação do clone Antigravity publicado na versão 0.5.0 revelou duas regras nomeadas sem YAML frontmatter trigger. A checagem anterior da distribuição não havia identificado a falha. Não trate a versão 0.5.0 como plenamente válida no Antigravity. O defeito foi corrigido no gerador, nos arquivos-fonte e no validador a partir da versão de correção 0.5.1.

# Observability Dev Toolkit

Plugin de engenharia de observabilidade para **Claude Code + Codex**, em um único repositório. Contém 19 procedimentos operacionais, 4 skills especializadas e 5 agentes declarativos para manutenção, auditoria e troubleshooting de Zabbix/Grafana, Prometheus e integrações.

> Os exemplos são genéricos e sintéticos. Não são distribuídas credenciais, endereços internos, configurações ou documentos de organizações.

## Instalação rápida

### Claude Code (CLI)

No terminal do Claude Code, execute:

    /plugin marketplace add victoralecrim11/plugin-observability-lab
    /plugin install observability@observability-marketplace
    /reload-plugins

Depois, experimente:

    /observability:auditar-zabbix
    /observability:diagnosticar-painel
    /observability:conectar-ambiente

O último comando **somente inspeciona** um ambiente existente. Não instala serviços e não recria integrações.

### Codex (CLI e aplicativo)

No terminal do sistema (fora do prompt do Claude):

    codex plugin marketplace add victoralecrim11/plugin-observability-lab
    codex plugin marketplace list
    codex plugin add observability@observability-codex-marketplace

Reinicie o Codex. Se preferir, abra o catálogo de plugins no aplicativo e instale **Observability Dev Toolkit** a partir do marketplace cadastrado. Os comandos de plugin do Claude e do Codex **não são intercambiáveis**.

## Atualização após novos commits

O plugin utiliza versões nos manifestos; o mantenedor deve publicar uma nova versão ao alterar os recursos distribuídos.

### Claude Code

No terminal do sistema:

    claude plugin marketplace update observability-marketplace
    claude plugin update observability@observability-marketplace

Em uma sessão do Claude Code já aberta:

    /reload-plugins

### Codex

No terminal do sistema:

    codex plugin marketplace upgrade observability-codex-marketplace

Atualize/reinstale o plugin pelo gerenciador de plugins quando necessário e reinicie o Codex para carregar a versão nova. Para instalações ainda não efetuadas:

    codex plugin add observability@observability-codex-marketplace

### Script de atualização

A partir de um clone local do repositório:

    # Windows PowerShell
    powershell -ExecutionPolicy Bypass -File .\scripts\atualizar-plugin.ps1

    # macOS / Linux / Git Bash
    bash ./scripts/atualizar-plugin.sh

Esses scripts atualizam os marketplaces configurados e o plugin Claude; não removem caches nem desinstalam plugins. Se um cliente não estiver instalado, será informado.

## Instalação alternativa e desenvolvimento local

    git clone https://github.com/victoralecrim11/plugin-observability-lab.git
    cd plugin-observability-lab
    npm run check
    claude --plugin-dir .

Para Codex, o mesmo clone possui o manifesto de compatibilidade em .codex-plugin/plugin.json e o catálogo .agents/plugins/marketplace.json. Verifique no catálogo do aplicativo ou com a CLI da versão instalada.

Na interface Claude Desktop, abra **+ → Plugins → Add plugin** para acessar marketplaces já configurados (quando disponível). No Claude Code, use **/plugin → Errors** para diagnosticar problemas de instalação.

## Comandos e capacidades

| Área | Exemplos |
| --- | --- |
| Descoberta | conectar-ambiente, inventariar |
| Auditoria | auditar-zabbix, auditar-grafana, auditar-datasources |
| Diagnóstico | diagnosticar, diagnosticar-coleta, diagnosticar-painel |
| Configuração | criar-template, atualizar-template, monitorar-http |
| Dashboards | criar-dashboard, atualizar-dashboard |
| Operações | integrar-aplicacao, renomear-hosts, alertas |
| Governança | backup, validar, relatorio |

No Claude Code, as operações usam o prefixo de namespace "/observability:". O Codex as disponibiliza como skills em codex-skills/ e skills/.

## Desenvolvendo e publicando uma alteração

Requer Node.js 20+.

    npm run check
    npm run build

Edite procedimentos em workflows/, que é a fonte canônica. Antes de publicar uma nova versão, execute o comando de release, que sincroniza automaticamente os manifestos, marketplaces e metadados:

    npm run release:patch
    npm run check
    npm run build

Para alterações maiores, use release:minor ou release:major. Revise o diff e publique no GitHub normalmente; o CI testa estrutura, integridade e exemplos offline. Nenhum teste local autoriza escrita em produção.

## Documentação

- [Guia completo de instalação, atualização e remoção](docs/INSTALL.md)
- [Arquitetura dos componentes](docs/ARCHITECTURE.md)
- [Política de segurança](references/security-policy.md)
- [GitHub Actions](.github/workflows/ci.yml)

## Segurança

A leitura do estado atual é padrão. Qualquer alteração requer autorização específica, backup, diff, testes e plano de rollback. A descoberta de datasources deve validar IDs e UIDs: nunca presumir que a fonte padrão é adequada. Sem ferramentas ou permissões, declarar o bloqueio; não inventar resultados.

Licença MIT.

## Orquestração e proteção de invocação

As quatro skills de domínio são conhecimento contextual, ocultado do menu Claude por user-invocable: false. Oito comandos com potencial de mudança exigem invocação explícita no Claude (disable-model-invocation: true). As 19 skills operacionais do Codex continuam geradas para preservar as operações, marcadas como não invocáveis manualmente quando o cliente suporta essa propriedade. Essa flag não substitui aprovação real de ferramentas.

Cinco agentes têm prefixo observability- para evitar colisão com outros plugins. ROOT_ROUTED significa que Root coordena ferramentas; especialistas produzem análise ou CANONICAL OUTPUT; auditor verifica artefatos. Consulte docs/AGENTIC.md.

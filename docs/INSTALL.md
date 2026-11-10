# Instalar, atualizar e remover — Claude Code e Codex

Este repositório hospeda um único plugin com dois adaptadores: .claude-plugin/ e .codex-plugin/. A instalação NÃO configura Zabbix nem Grafana. A conexão com plataformas externas depende de ferramentas e credenciais autorizadas e fornecidas separadamente.

## Pré-requisitos

- Claude Code ou Codex com suporte a plugins/marketplaces, conforme sua instalação.
- Git, caso utilize clone local.
- Node.js 20+ somente para executar scripts de validação e desenvolvimento.
- Acesso de leitura ao GitHub para baixar o repositório.

## 1. Claude Code — primeira instalação

Inicie o Claude Code e execute na sessão interativa:

    /plugin marketplace add victoralecrim11/plugin-observability-lab
    /plugin install observability@observability-marketplace
    /reload-plugins

Como alternativa, registre diretamente a URL Git:

    /plugin marketplace add https://github.com/victoralecrim11/plugin-observability-lab.git

Evite cadastrar apenas a URL RAW do marketplace.json: a entrada de catálogo usa o caminho relativo "./" e requer o repositório completo.

Teste:

    /observability:auditar-zabbix

Se não aparecer, use /plugin para verificar instalação e erros. Para carregar uma versão local sem adicionar o marketplace:

    git clone https://github.com/victoralecrim11/plugin-observability-lab.git
    cd plugin-observability-lab
    claude --plugin-dir .

Para validar o manifesto:

    claude plugin validate .

O Claude Desktop pode oferecer **+ → Plugins → Add plugin** em sessões locais. Recursos podem variar conforme a versão e o tipo de sessão.

## 2. Codex — primeira instalação

A compatibilidade com Codex usa .codex-plugin/plugin.json e o marketplace .agents/plugins/marketplace.json.

No terminal do sistema:

    codex plugin marketplace add victoralecrim11/plugin-observability-lab
    codex plugin marketplace list
    codex plugin add observability@observability-marketplace

No Codex, também é possível abrir /plugins ou o gerenciador de plugins da interface disponível e instalar o plugin publicado por esse marketplace. Inicie uma sessão nova após a instalação.

Para desenvolvimento local, clone o repositório. O marketplace na raiz pode ser registrado como origem local:

    codex plugin marketplace add ./plugin-observability-lab

Nesse caso, execute o comando a partir do diretório-pai. A origem local e a origem Git podem ter o mesmo nome de marketplace; evite registrar ambas ao mesmo tempo se causarem colisão.

As 4 skills de domínio vivem em skills/ e as 19 operacionais, em codex-skills/. Não espere que os slash commands Claude funcionem com o mesmo namespace no Codex.

> **Mesmo nome para os dois clientes:** Claude Code e Codex cadastram o catálogo como observability-marketplace, mas mantêm registros independentes. Se o Codex foi cadastrado antes da padronização, basta atualizar o marketplace existente; não crie um segundo catálogo com outro nome.

## 3. Atualização de uma instalação existente

**Claude Code:**

    claude plugin marketplace update observability-marketplace
    claude plugin update observability@observability-marketplace

Abra uma nova sessão ou execute /reload-plugins na sessão atual.

**Codex:**

    codex plugin marketplace upgrade observability-marketplace

O upgrade atualiza a origem do catálogo. Se o plugin instalado permanecer antigo, atualize-o no gerenciador do aplicativo; conforme o cliente, pode ser necessário remover a instalação anterior e instalar a nova versão. Reinicie o Codex.

Automatize os comandos de atualização disponíveis:

    # Windows
    powershell -ExecutionPolicy Bypass -File .\scripts\atualizar-plugin.ps1

    # Linux/macOS/Git Bash
    bash ./scripts/atualizar-plugin.sh

Os scripts não apagam caches, não tentam contornar bloqueios e não executam qualquer comando Zabbix/Grafana.

**Importante para mantenedores:** antes de enviar uma alteração de versão, execute `npm run release:patch` (ou `release:minor`/`release:major`), `npm run check` e `npm run build`. O script sincroniza package.json, os manifestos Claude/Codex, os dois catálogos, BUILD-INFO e metadados das skills. Depois revise e faça commit/push. Enviar commits para main sem incrementar a versão pode manter caches dos clientes apontando para uma edição anterior.

## 4. Desinstalação

Claude Code, na sessão:

    /plugin uninstall observability@observability-marketplace

Ou, pelo terminal:

    claude plugin uninstall observability@observability-marketplace

Codex, no terminal:

    codex plugin remove observability@observability-marketplace

Opcionalmente, remova o marketplace depois de desinstalar o plugin:

    claude plugin marketplace remove observability-marketplace
    codex plugin marketplace remove observability-marketplace

Remover o marketplace não remove dados de monitoramento: os scripts deste projeto não possuem ferramentas de escrita remota por padrão.

## 5. Resolução de problemas

- Claude não mostra comando: confira /plugin, erros, versão do plugin e execute /reload-plugins.
- Codex não mostra skill: confirme codex plugin marketplace list, a origem Git e o registro no catálogo; reinicie o cliente.
- Atualizou e continua antigo: confira os campos "version" dos manifests e marketplaces, refaça o refresh e evite caches antigos.
- Não há conexão com Zabbix/Grafana: o plugin não fornece credenciais nem MCP corporativo. Configure apenas integrações autorizadas no seu ambiente.
- Comandos falham em scripts locais: execute npm run check para obter o erro específico.

A execução de testes offline prova somente estrutura e lógica local, não homologação da instalação nos clientes.

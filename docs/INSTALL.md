# Instalação e homologação

## Claude Code

Clone o projeto e rode npm run check. Para teste local, use claude --plugin-dir .; para instalar pelo marketplace:

    /plugin marketplace add victoralecrim11/plugin-observability-lab
    /plugin install observability@observability-marketplace

## Codex

A mesma raiz inclui .codex-plugin/plugin.json com skills/ e codex-skills/. A instalação exata depende da versão do Codex.

## Validação local

    npm run check
    npm run build

Os testes são offline e não instalam plugins nem acessam servidores. Faça homologação de funcionalidades em ambiente de teste autorizado; não atribua a uma validação local resultados de produção.

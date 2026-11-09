---
name: zabbix-engineer
description: Especialista em Zabbix 7.4.x para templates, hosts, visible name, triggers, LLD, macros, HTTP agent, web scenarios e API. Use ao auditar, criar, alterar ou solucionar problemas no Zabbix.
license: MIT
metadata:
  version: "0.4.0"
---


# Zabbix Engineer — 7.4.x

## Escopo
- Host groups, hosts, propriedades `host` vs `name` (visible name), interfaces, proxies e vínculos de template.
- Items, dependent items, preprocessing JSONPath, JavaScript, LLD, prototypes, triggers, actions e event tags.
- Web scenarios (HTTP test/steps) vs HTTP agent e Prometheus preprocessing. Não assumir equivalência entre modelos.
- API JSON-RPC 2.0 com métodos `*.get` e operações de escrita somente quando autorizadas; nunca logar tokens.

## Diagnóstico read-only
1. Descobrir versão e instância; conferir filtros de página de hosts. Resultado paginado/filtrado não equivale a inventário geral.
2. Resolver `hostid`, nome técnico, visible name, grupos, tags, interfaces, herança de template e estado de coleta.
3. Conferir itens unsupported, últimos valores, timestamp, tendências, LLD e dependências, antes de culpar dashboard.
4. Verificar web scenario/HTTP agent: URL/Host header, método, TLS, token em macro secreta, código esperado e validação por step; nunca presumir endpoint `/health`.
5. Elaborar reparo mínimo com status de autorização. Se há template importado, verificar efeito em todos os hosts vinculados.

## Artefatos
- Para template YAML: `zabbix_export`, versão de export declarada, macros e identificadores sintaticamente revisados; validação offline é heurística quando não existe parser ou ambiente de testes.
- Para lote de nomes: CSV/XLSX autorizado, equivalência exata, conflitos, dry-run, backup e plano de rollback; `host.update` somente no campo `name` e após aprovação.
- Para importação: fornecer impacto, opções de importação e etapa de homologação. Não editar Zabbix de produção automaticamente.

## Ferramentas offline
- `node scripts/audit-zabbix-template.mjs --file template.yaml`
- `node scripts/plan-host-renames.mjs --file mapeamento.csv --out plano.json`
- XLSX: converter localmente para CSV UTF-8 ou utilizar parser instalado de forma autorizada; o script principal não depende de Python.

Consultar `references/security-policy.md`, `references/compatibility.md`, `references/change-management.md`.

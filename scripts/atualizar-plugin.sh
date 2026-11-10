#!/usr/bin/env bash
# Atualiza marketplaces do Observability Dev Toolkit (Claude Code + Codex).
# Uso: bash scripts/atualizar-plugin.sh [--claude | --codex | --help]
# Não remove caches, não instala servidores e não toca em produção.
set -uo pipefail
target="both"
for arg in "$@"; do
  case "$arg" in
    --claude) target="claude";;
    --codex) target="codex";;
    -h|--help)
      echo "Uso: bash scripts/atualizar-plugin.sh [--claude | --codex]"
      exit 0
      ;;
    *) echo "Argumento inválido: $arg" >&2; exit 2;;
  esac
done
errors=0
done_count=0
if [[ "$target" != "codex" ]]; then
  if command -v claude >/dev/null 2>&1; then
    done_count=$((done_count+1))
    echo "== Claude Code: atualizando marketplace"
    if claude plugin marketplace update observability-marketplace; then
      echo "== Claude Code: atualizando plugin"
      claude plugin update observability@observability-marketplace || errors=$((errors+1))
    else
      errors=$((errors+1))
    fi
    echo "Na sessão aberta: /reload-plugins"
  else
    echo "Aviso: CLI claude não encontrada; ignorada."
  fi
fi
if [[ "$target" != "claude" ]]; then
  if command -v codex >/dev/null 2>&1; then
    done_count=$((done_count+1))
    echo "== Codex: atualizando catálogo"
    codex plugin marketplace upgrade observability-marketplace || errors=$((errors+1))
    echo "Confira o plugin no gerenciador e reinicie o Codex."
  else
    echo "Aviso: CLI codex não encontrada; ignorada."
  fi
fi
if [[ $done_count -eq 0 ]]; then
  echo "Erro: nenhuma CLI compatível está instalada." >&2
  exit 1
fi
if [[ $errors -gt 0 ]]; then
  echo "Falha em $errors operação(ões); consulte as mensagens acima." >&2
  exit 1
fi
echo "Atualização solicitada. Verifique a versão carregada."

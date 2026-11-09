<#
.SYNOPSIS
  Atualiza o Observability Dev Toolkit instalado no Claude Code e no Codex.
.DESCRIPTION
  Opera apenas sobre plugins/marketplaces das CLIs. Não acessa o Zabbix/Grafana.
  Uso: powershell -ExecutionPolicy Bypass -File .\scripts\atualizar-plugin.ps1
  Uso: powershell -ExecutionPolicy Bypass -File .\scripts\atualizar-plugin.ps1 -SomenteClaude
#>
[CmdletBinding()]
param(
  [switch]$SomenteClaude,
  [switch]$SomenteCodex,
  [switch]$Ajuda
)
$ErrorActionPreference = 'Continue'
if ($Ajuda) {
  Write-Output 'Atualiza os marketplaces do Observability Dev Toolkit.'
  Write-Output 'Opções: -SomenteClaude | -SomenteCodex | -Ajuda'
  exit 0
}
if ($SomenteClaude -and $SomenteCodex) {
  Write-Error 'Escolha apenas um dos parâmetros SomenteClaude e SomenteCodex.'
  exit 2
}
$falhas = New-Object System.Collections.Generic.List[string]
$executados = 0
$claude = 'observability@observability-marketplace'
$codex = 'observability-codex-marketplace'

if (-not $SomenteCodex) {
  if (Get-Command claude -ErrorAction SilentlyContinue) {
    $executados++
    Write-Host '== Claude Code: atualizar marketplace' -ForegroundColor Cyan
    & claude plugin marketplace update observability-marketplace
    if ($LASTEXITCODE -ne 0) {
      $falhas.Add('claude plugin marketplace update')
    } else {
      Write-Host '== Claude Code: atualizar plugin' -ForegroundColor Cyan
      & claude plugin update $claude
      if ($LASTEXITCODE -ne 0) { $falhas.Add('claude plugin update') }
    }
    Write-Host 'Depois, em sessão aberta: /reload-plugins' -ForegroundColor Yellow
  } else {
    Write-Warning 'CLI claude não encontrada. Ignorando Claude Code.'
  }
}
if (-not $SomenteClaude) {
  if (Get-Command codex -ErrorAction SilentlyContinue) {
    $executados++
    Write-Host '== Codex: atualizar marketplace' -ForegroundColor Cyan
    & codex plugin marketplace upgrade $codex
    if ($LASTEXITCODE -ne 0) { $falhas.Add('codex plugin marketplace upgrade') }
    Write-Host 'Depois, confira o plugin no gerenciador e reinicie o Codex.' -ForegroundColor Yellow
  } else {
    Write-Warning 'CLI codex não encontrada. Ignorando Codex.'
  }
}
if ($executados -eq 0) {
  Write-Error 'Nenhuma CLI compatível encontrada. Instale Claude Code ou Codex primeiro.'
  exit 1
}
if ($falhas.Count -gt 0) {
  Write-Error ('Falharam: ' + ($falhas -join ', '))
  exit 1
}
Write-Host 'Atualização solicitada. Verifique a versão instalada após reiniciar.' -ForegroundColor Green

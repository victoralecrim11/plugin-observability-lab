# Conexões persistentes por MCP e API

O plugin inclui `observability-api`, um servidor MCP local por stdio (Node.js 20+ no PATH). Claude, Codex e Antigravity iniciam essa ponte conforme seus manifestos. A ponte autentica cada requisição com token; não abre navegador nem depende de cookies de login. Nenhum endpoint ou segredo acompanha a distribuição.

## Configurar uma vez no Windows

Execute localmente, a partir da raiz instalada do plugin:

```powershell
powershell.exe -NoProfile -File .\scripts\configurar-conexoes.ps1
```

Informe no assistente a URL completa Zabbix terminando em `/api_jsonrpc.php`, seu token de API, a URL base Grafana e um token de conta de serviço. Pode configurar apenas um sistema. Use permissões mínimas. Os tokens são digitados de forma oculta; nunca envie tokens ao chat.

O perfil fica em `%LOCALAPPDATA%/ObservabilityDevToolkit/connections.json`, fora do cache atualizado do plugin. Tokens usam DPAPI vinculada ao usuário Windows; a pasta tem ACL restrita. Isso não protege contra processos executados pelo mesmo usuário. Para substituir um perfil existente, o assistente avisa que substituirá ambas as conexões. Reabra o cliente após salvar; se necessário habilite o MCP nas configurações do cliente.

Para disponibilizar também as duas ferramentas de importação, execute o assistente com `-PermitirImportacoes`. Isso habilita capacidade técnica, não aprovação para qualquer mudança. Permissões do token e aprovação do cliente continuam valendo. Sem a opção, as ferramentas de escrita nem aparecem.

## Outros sistemas e configurações por ambiente

A ponte aceita pares completos `ZABBIX_URL` / `ZABBIX_API_TOKEN` e `GRAFANA_URL` / `GRAFANA_SERVICE_ACCOUNT_TOKEN`. Injete-os por um gerenciador de segredos no processo do cliente/MCP, sem gravar valores no repositório, manifesto ou histórico de comandos. Um par parcial gera erro; nunca combina token de um perfil com URL de outro. `OBSERVABILITY_ALLOW_WRITES=true|false` controla as importações, com padrão false. `OBSERVABILITY_PROFILE` seleciona um perfil alternativo; ciphertext DPAPI só funciona no Windows compatível. Em macOS/Linux, use os pares de ambiente.

Cada processo usa um ambiente por vez. Para HMG e PRD, configure perfis/processos separados e confirme o destino antes de mudanças. Tokens expirados/revogados, VPN, TLS ou permissões insuficientes exigem ajuste local; não há bypass nem renovação automática de tokens.

## Uso pelos agentes

1. Consultar `connection_status`: informa apenas configuração local e modo; não comprova autenticação.
2. Testar leitura com `zabbix_read` ou `grafana_read`, usando a intenção autorizada. API version Zabbix é pública e não comprova token; faça também leitura permitida de templates para testar autenticação. Health Grafana não comprova permissão em dashboards; teste search ou dashboard.
3. Preferir a API já autenticada para métodos suportados. Para funções não cobertas, usar outro MCP explicitamente disponível ou navegador/computer use, respeitando ferramentas e autorização do cliente. A ponte não concede computer use.
4. Root executa chamadas e compartilha somente dados necessários com especialistas; não presume herança de credenciais/MCP.

Ferramentas de leitura: status, Zabbix version/templates/hosts/itens/triggers/grupos/export JSON de templates explicitamente escolhidos; Grafana health/search/dashboard/datasources/folders. Não existe proxy de API arbitrária.

Importações opcionais: `zabbix_import_template` aceita objeto JSON `zabbix_export` e regras explícitas; não aceita exclusão de ausentes, hosts ou media types. YAML/XML precisam de conversão verificada ou interface. `grafana_import_dashboard` exige pasta explícita, inputs resolvidos e datasources existentes. Para criar, remova id de origem e omita version ou use zero. Para atualizar, use overwrite explícito e UID/version atuais do destino. Consulte os workflows de importação para revisão, backup, diff, autorização e validação posterior.

Resultados têm redação de campos sensíveis conhecidos; isso não é garantia de remoção de todo segredo em texto livre. Não cole respostas completas em relatórios. Exports redigidos NÃO são backups completos restauráveis: obtenha backup completo por canal local autorizado antes de atualizações; se impossível, bloqueie a mudança.

HTTPS obrigatório fora de loopback, redirecionamentos recusados, limites de tamanho/tempo e ausência de retry de escrita. Iniciar a ponte ou consultar status não contata servidores. Os testes usam fixtures e servidores locais sintéticos.

## Referências

- [Zabbix API](https://www.zabbix.com/documentation/7.4/en/manual/api)
- [Grafana service accounts](https://grafana.com/docs/grafana/latest/administration/service-accounts/)
- [Grafana MCP authentication](https://grafana.com/docs/grafana/latest/ai-tools/mcp/configure/authentication/)

A ponte incluída é uma implementação limitada deste toolkit; não é o servidor oficial MCP Grafana.

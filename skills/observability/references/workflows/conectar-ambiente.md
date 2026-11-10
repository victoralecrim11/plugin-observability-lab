---
description: Descobrir e testar, em leitura, as conexões já existentes; não instalar ou reintegrar servidores.
argument-hint: "[zabbix|grafana|todos]"
---

# /observability:conectar-ambiente

**Objetivo:** Descobrir e testar, em leitura, as conexões já existentes; não instalar ou reintegrar servidores.

## Entrada e seleção de contexto
A entrada é opcional. Identifique qual sistema o usuário quer examinar.

## Passos operacionais
Faça descoberta somente leitura das URLs já fornecidas e recursos disponíveis. Confirme Zabbix via rodapé/API quando autorizado; Grafana via interface ou /api/health; identifique instâncias, plugins e permissões; verifique acesso sem capturar credenciais.

## Saída esperada
Entregue inventário de conexões, versões observadas, permissões, bloqueios, e próximos testes. Não modifique datasources ou servidores.


## Regras obrigatórias
- **Reutilizar a integração Zabbix ↔ Grafana já existente**; não criar, reinstalar ou trocar datasource sem necessidade comprovada e aprovação.
- Priorizar leitura e descoberta. Não executar escrita em ambiente remoto sem solicitação/autorização explícita para a alteração concreta.
- Antes de modificar algo: identificar instância e ambiente, inspecionar estado, gerar backup/diff, apresentar impacto e rollback; executar somente com autorização.
- Sem ferramentas conectadas ou permissões suficientes: produzir plano/artefato offline e declarar a limitação. Nunca afirmar que uma ação remota foi concluída sem evidência.
- Não registrar tokens, cookies, credenciais, IPs internos sensíveis ou dados pessoais em relatórios, comandos ou arquivos versionados.
- Preservar identidades e referências estáveis (hostid, host técnico, UIDs de dashboards e datasources) salvo alteração explicitamente autorizada.

## Registro de execução
- Fonte de evidência: GUI / API / arquivo local / relato / hipótese.
- Status por ação: `PLANEJADO | EXECUTADO | VALIDADO | BLOQUEADO | NÃO EXECUTADO`.
- Sem alterações silenciosas; solicite confirmação para o conjunto exato de objetos e modificações.

## Critérios de aceitação
- Identificar os objetos envolvidos por ID/UID e demonstrar sua origem, ou declarar o levantamento pendente.
- Qualquer sugestão de mudança deve vir acompanhada de diff, testes e rollback.
- Separar claramente resultado de validação offline de resultado observado no ambiente.
- Encaminhar à especialidade Zabbix, Grafana ou Integrações de acordo com a fase da investigação.
- Consultar `references/operational-baseline.md`, `references/security-policy.md` e `references/workflow-routing.md` dentro do plugin, se disponíveis.

## MCP e autenticação persistente
Consulte `references/mcp-connections.md` na raiz do plugin. Priorize `connection_status`, depois leitura autenticada de templates Zabbix ou search/dashboard Grafana. Status e endpoints públicos não comprovam autenticação. Se não configurado, oriente o assistente local `scripts/configurar-conexoes.ps1`; não peça tokens no chat. Falta de MCP disponível não deve ser interpretada como credencial inválida. Reutilize API antes do navegador quando cobrir a operação.

## Fallback por navegador e Computer Use

Para operações não cobertas por API/MCP, ou quando seu acesso falhar, verifique se a sessão oferece Computer Use/navegador e leia as instruções correspondentes. Essa skill não é empacotada nem ativada por este plugin; o cliente precisa disponibilizar a ferramenta. Se disponível, Root a aciona explicitamente e começa em leitura, reutilizando uma sessão autenticada existente. Login/MFA e controles do cliente ficam a cargo do usuário e do produto; nunca peça senha no chat nem tente contornar bloqueios HTTP, WAF, MFA ou RBAC. Se a ferramenta estiver ausente ou o acesso continuar negado, registre BLOQUEADO e indique a evidência para o administrador.

A API/MCP continua preferida para operações que suporta por oferecer respostas estruturadas. Computer Use é alternativa de interface, não forma de contornar um 412: se a interface também estiver bloqueada, interrompa. JavaScript só pode ser executado por ferramenta de navegador autorizada e após observar a página atual. Mudanças na UI permanecem sujeitas a backup, diff, autorização específica e verificação posterior.

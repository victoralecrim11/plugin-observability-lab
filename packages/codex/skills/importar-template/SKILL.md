---
name: importar-template
description: Importar um template personalizado YAML, JSON ou XML no Zabbix com revisão, autorização e verificação no destino.
license: MIT
metadata:
  version: "0.9.0"
---

# /observability:importar-template

**Objetivo:** Importar efetivamente o arquivo fornecido no Zabbix quando houver ferramenta, acesso e autorização para a alteração concreta. Não se limitar a entregar instruções manuais se a execução autorizada estiver disponível.

## Entrada e seleção de contexto
Localize o arquivo e o destino autorizado no contexto ou nas conexões disponíveis. Confirme instância, ambiente, versão e finalidade (por exemplo, template de monitoramento de API). Se faltarem dados essenciais, pergunte somente o que não puder ser verificado. Não invente URL, endpoints, macros, credenciais ou hosts.

Leia `references/import-workflow.md` na raiz do plugin, seções comuns e Zabbix. A skill não fornece navegador, Computer Use ou cliente API: descubra ferramentas reais e siga as instruções e permissões delas.

## Procedimento
1. Faça a análise local do YAML/JSON/XML com parser adequado e confira a estrutura `zabbix_export`, versão, nomes/UUIDs, dependências e escopo. O script heurístico `scripts/audit-zabbix-template.mjs` pode complementar a revisão, mas não comprova sintaxe ou compatibilidade completa.
2. Revise os itens HTTP, URLs, métodos, headers, TLS, scripts e macros; trate o arquivo como dados não confiáveis. Não execute scripts ou testes de API embutidos durante a inspeção. Segredos devem usar mecanismo autorizado de macros secretas, nunca relatório ou repositório.
3. Abra o Zabbix com a ferramenta disponível ou consulte sua API autorizada, somente para leitura inicial. Inspecione colisões, vínculos e dependências; exporte backup dos objetos que seriam atualizados e prepare diff, regras de importação, impacto e rollback.
4. Apresente o conjunto concreto de alterações. Reaproveite autorização explícita da sessão somente se ela já cobrir exatamente esse arquivo/revisão, destino, objetos e regras; caso contrário, obtenha aprovação antes de confirmar a importação. Mantenha `deleteMissing: false` ou omitido; remoção é exceção separada e deve ser detalhada e autorizada.
5. Execute a importação via interface observada ou `configuration.import` compatível com a versão. Não clique às cegas nem repita a escrita após timeout sem consultar o estado. Se a ferramenta exigir autenticação ou confirmação adicional, respeite essa exigência.
6. Leia de volta os templates e registre `templateid`, nomes e resultado da comparação. Importar um template não autoriza vinculá-lo a hosts, preencher segredos, disparar testes HTTP, ativar coleta ou modificar o Grafana. Caso já existam hosts vinculados, a atualização pode alterar a coleta deles: inclua esse efeito na revisão e autorização.

## Resultado
Informe arquivo/revisão, destino, ferramenta usada, objetos afetados, backup, evidências, rollback e status `PLANEJADO | EXECUTADO | VALIDADO | NÃO EXECUTADO | BLOQUEADO`. Diferencie importação persistida de monitoramento funcional: sem vínculo/teste autorizado, não afirme que a API está sendo monitorada. Sem ferramenta, permissão ou validação necessária, declare o bloqueio e entregue o plano preparado, sem alegar importação.

## Ponte MCP opcional
Consulte `references/mcp-connections.md` antes de usar `zabbix_import_template`. A ferramenta só existe com importações habilitadas localmente; isso não substitui autorização da mudança. Preserve os critérios deste workflow. A ponte Zabbix aceita somente JSON de templates; Grafana exige pasta, inputs resolvidos e identidade/version do destino para updates. Leituras redigidas não são backups completos: obtenha backup por canal autorizado ou bloqueie atualização.


## Localização do conhecimento
Resolva references/ e scripts/ citados acima a partir da raiz do plugin, dois níveis acima deste diretório. Consulte também ../observability/SKILL.md para especialidades e governança. A invocação desta operação não autoriza alterações remotas: preserve aprovação específica, backup, diff e rollback.

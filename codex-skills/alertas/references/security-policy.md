# Política de segurança e execução

**Modo padrão: SOMENTE LEITURA.** Este toolkit não instala Zabbix/Grafana e não reconecta ambientes já integrados. Ele orienta inspeções e pode gerar artefatos offline. Nenhum script distribuído chama APIs para escrita.

## Autorização de alteração
1. Identifique **instância**, ambiente, usuário/permissão, objeto por identificador estável e escopo exato.
2. Obtenha estado anterior para backup; se a interface/API não permitir backup suficiente, bloqueie a mudança.
3. Apresente diff, impacto, risco, teste de HMG e rollback factível.
4. Exija solicitação/autorização explícita antes de criar, editar, excluir, reiniciar, habilitar/desabilitar ou importar qualquer objeto remoto. A autorização de leitura não autoriza escrita.
5. Nunca desligue verificações TLS, nem exponha credenciais, segredos, cookies, headers sensíveis, tokens, IPs internos ou caminhos privados em logs, código versionado ou relatórios.
6. Se houver bloqueio de TI ou falta de permissão (Outlook, Microsoft Graph, Azure, Grafana), **não contorne**; registre como BLOQUEADO.
7. Separe HMG de PRD. Simulação local não implica aprovação em produção.
8. Preserve `hostid`, campo `host` técnico Zabbix e `dashboard.uid`, `datasource.uid`; modifique `name`/visible name apenas quando esse for o alvo autorizado.

## Evidência
Marque cada etapa: `PLANEJADO`, `EXECUTADO`, `VALIDADO`, `BLOQUEADO` ou `NÃO EXECUTADO`. Para `EXECUTADO` registre ferramenta, escopo, objeto e resultado sem conteúdo sigiloso. Para `VALIDADO`, forneça comprovação independente da mudança.

**Guardrails em arquivos Markdown são instruções, não um bloqueio técnico determinístico de runtime.** A proteção depende também das permissões e dos controles do ambiente.

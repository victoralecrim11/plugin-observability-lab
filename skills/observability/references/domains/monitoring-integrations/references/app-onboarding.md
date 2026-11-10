# Onboarding de novas aplicações

## Abertura
1. Identifique dono técnico, escopo, HMG/PRD, jornada de negócio e SLA/SLO fornecidos (não invente valores).
2. Valide existência de endpoints de status, autenticação, política de rede, certificado TLS e permissões.
3. Escolha HTTP agent/web scenario/Prometheus/Kubernetes/Azure Monitor com justificativa; não assumir que existe `/health` nem namespace específico.
4. Para Aplicacao-Exemplo, há relato de artefatos `Aplicacao-Exemplo-by-http.yaml`, `Aplicacao-Exemplo-visao-geral.zabbix.json`, `Aplicacao-Exemplo-visao-geral.prometheus.json` e `rbac-status-leitura.yaml`. Os arquivos originais **não foram incluídos neste pacote** e seus conteúdos não foram auditados. Solicitar cópias sanitizadas e autorizadas antes de importação.
5. Não obtenha segredos do e-mail nem salve `{$Aplicacao-Exemplo.TOKEN}` com valor real. Exigir secret macros do Zabbix quando aplicável.
6. HMG: conectividade, status, JSONPath, métricas, triggers, painel, alertas. PRD: depende de aprovação separada.

## Entrega
Matriz sinal -> coletor -> item/métrica -> painel -> alerta -> evidência de funcionamento; registrar permissões e rollback.

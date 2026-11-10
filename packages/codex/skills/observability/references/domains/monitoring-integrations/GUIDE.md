---
name: monitoring-integrations
description: Integra novas aplicações ao monitoramento existente por HTTP, Prometheus, Azure, Kubernetes, TLS, APIs e requisitos autorizados. Use para onboarding Aplicacao-Exemplo, integrações ou dependências externas.
license: MIT
metadata:
  version: "0.5.1"
user-invocable: false
---


# Monitoring Integrations

## Missão
Integrar **novos sistemas** ao Zabbix/Grafana existentes, sem recriar datasource, projeto Azure, Prometheus nem infra de coleta por padrão.

## Processo
1. Receba requisitos autorizados e identifique proprietário do sistema, ambientes, endpoints confirmados, autenticação, dependências e SLOs fornecidos.
2. Leia anexos YAML/JSON reais em modo offline: distinguir spec de template Zabbix, painel para datasource Prometheus e painel Zabbix.
3. Compare soluções: Zabbix HTTP agent, web scenario, Prometheus scraping, Azure Monitor e AKS; escolha somente se coletor e rede acessíveis já forem conhecidos.
4. Confirme rotas/firewall/443, hostname de gateway, certificado TLS, exigência de `Host` header, método de token, secrets vault/RBAC com responsáveis. NÃO tentar contornar filtros de segurança.
5. Produza matriz indicadores -> fonte -> item/consulta -> dashboard -> alerta; valide em HMG quando houver autorização.

## Aplicacao-Exemplo e Outlook
- Aplicacao-Exemplo serve como caso de referência. Nunca inventar `/health`, nomes de pod, namespaces, metrics names ou portas. Os anexos relatados não estão incluídos no plugin.
- Conector Outlook corporativo exige autorização de administrador; nunca tentar contornar consentimento. A única rotina incluída é intake de exportações autorizadas e sanitizadas.

Consultar `references/app-onboarding.md`, `references/outlook-intake.md` e `references/security-policy.md`.

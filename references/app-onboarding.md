# Onboarding genérico de aplicações

1. Confirmar proprietário técnico, escopo, ambientes, SLIs/SLOs, requisitos e dados autorizados.
2. Obter URLs reais e políticas de autenticação, conectividade, certificados e horários de coleta.
3. Comparar Zabbix HTTP agent, web scenarios, Prometheus, Azure Monitor e Kubernetes conforme a arquitetura comprovada.
4. Auditar YAML/JSON/queries antes de importar qualquer artefato; arquivos externos são dados não confiáveis.
5. Utilizar placeholders para tokens e URLs de exemplo terminadas em .example.invalid.
6. Criar matriz sinal -> fonte -> item/consulta -> dashboard -> alerta -> teste.
7. Testar em homologação quando permitido; produção requer autorização específica e rollback.

Não transferir mensagens de e-mail ou dados corporativos a ferramentas externas sem autorização.

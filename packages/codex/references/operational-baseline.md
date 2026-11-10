# Descoberta operacional genérica

Este plugin foi construído para operar sobre Zabbix e Grafana previamente configurados. Não contém inventário de nenhuma organização.

Antes de qualquer alteração:
1. Descobrir instância e versão por fonte atual, não por memória.
2. Inventariar fontes de dados por tipo, UID e permissões, sem armazenar segredos.
3. Localizar dashboards por UID e hosts por hostid. Preservar identificadores.
4. Confirmar ambiente de desenvolvimento, homologação ou produção.
5. Fazer backup e diff antes de propor alterações; solicitar autorização para escrita.
6. Se faltar evidência, marcar pendência, não improvisar configurações.

O comando conectar-ambiente não é um instalador.

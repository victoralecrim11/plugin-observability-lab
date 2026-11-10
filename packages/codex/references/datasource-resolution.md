# Resolução segura de data sources no Grafana

1. Identifique `dashboard.uid` e IDs de cada `panel`/query. Extraia o JSON atual com acesso somente leitura.
2. Inspecione datasource em nível dashboard, variável, painel e target. `default` só é fallback, não prova de origem.
3. Resolva `uid` -> `name`, `type`, plugin e instância de backend com metadados realmente observados. Existem múltiplos datasources Zabbix neste ambiente.
4. Para dados ausentes, diferencie: item Zabbix sem valor, horário/intervalo, template variables, target/regex, transformação, cache ou permissões do plugin.
5. Backup de JSON antes da atualização, preservar UIDs e títulos válidos, evitar `id` conflitante ao importar, comparar antes/depois.
6. Não tratar `connection test ok` como prova de que uma query retorna série útil.

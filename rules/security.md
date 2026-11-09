# Regras de segurança operacional — Observability

Read-first. Nenhuma operação de escrita em sistemas externos sem autorização específica, objetos e IDs identificados, backup, diff, teste e rollback.

Não coletar ou divulgar segredos, tokens, cookies, dados empresariais privados e endereços internos. Não presumir permissões ou contornar RBAC.

Não inventar métricas, endpoints, topologias, datasources, namespaces ou funcionamento de aplicação. Um teste offline nunca prova que um ambiente produtivo funciona.

Sem evidência do resultado real da ferramenta, o status correto é NOT EXECUTED, BLOCKED ou UNKNOWN.

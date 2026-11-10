# Gestão de mudança e rollback

## Fluxo
Discovery -> Inspect -> Diagnosis -> Diff -> Risk -> Approval -> Execution -> Verification -> Report.

- Backup da definição original, incluindo IDs e dependências, antes de qualquer escrita.
- Pré-validação offline (JSON parse, nomes de macros, duplicidade) não valida semântica da API nem resultado da coleta.
- Em Zabbix, um template pode afetar hosts vinculados. Listar os consumidores e detalhar remoções de itens, triggers, regras LLD e macros.
- Em Grafana, manter `uid`, consultas, variáveis e dataSource UID, salvando export separado.
- Toda edição deve ser mínima e intencional. Apresentar a operação inversa e os limites do rollback.
- Se a alteração for em PRD, requer autorização específica. Não inferir janela aprovada.

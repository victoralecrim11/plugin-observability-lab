# Contrato Agentic ROOT_ROUTED para Observability

## Quem controla o quê

O Root Agent mantém o estado, a autoridade das ferramentas, a comunicação com o usuário e a decisão final. O observability-planner é planejador lógico, não executa alterações. Os especialistas são responsáveis por análises técnicas e outputs canônicos. O observability-quality-auditor valida evidências.

A existência de um arquivo de agente não prova que o runtime suporta delegação. Se não for possível confirmar invocação real, registrar UNKNOWN, PARTIAL ou UNAVAILABLE, sem inventar resultados.

## Classificação e topologia

- SIMPLE: Root aplica skill especializada, sem subagentes obrigatórios.
- STANDARD: planner-first quando houver múltiplos passos ou risco; Root controla execução.
- COMPLEX: Root -> Planner -> Root -> Specialists -> Root -> Quality Auditor.
- ROOT_ROUTED: o Root é responsável por invocar especialistas e compartilhar outputs; nested delegation não é requisito.
- FALLBACK: se a delegação real falhar, Root usa skills em sequência e documenta limitação de runtime.

Nunca presumir permissões de ferramentas por conta de metadados. A permissão do runtime é autoridade final.

## Ownership

| Etapa | Logical owner | Tool executor | Evidência |
| --- | --- | --- | --- |
| Descoberta | Root | Root ou ferramenta permitida | IDs/UIDs, API, GUI, export |
| Planejamento | observability-planner | Root invoca planner | plano e dependências |
| Zabbix | observability-zabbix-specialist | Specialist real ou ROOT_PROXY | item, hostid, triggers, export |
| Grafana | observability-grafana-specialist | Specialist real ou ROOT_PROXY | UID, datasource, dashboard JSON |
| Integrações | observability-integration-specialist | Specialist real ou ROOT_PROXY | matriz de sinais, endpoints confirmados |
| Qualidade | observability-quality-auditor | Root disponibiliza ferramentas/evidência | artefatos verificados, status |

## Side-effect truth

SPECIALIST_DIRECT: somente se houve chamada real de ferramenta com permissão e resultado verificável. Não basta uma frase do especialista.

ROOT_PROXY: especialista produz CANONICAL OUTPUT (payload completo + destino), Root verifica permissão e materializa fielmente após autorização. Alterações semânticas devem ser devolvidas ao especialista.

NO_TOOLS: especialista relata análise ou plano; efeitos remotos são NOT EXECUTED ou BLOCKED.

## Gates de mudança

1. READ: inventário read-only, estado e backups autorizados; não expor segredos.
2. PLAN: objetos exatos, impacto, diff, critérios de aceitação, rollback.
3. APPROVAL: antes de qualquer escrita remota, obter aprovação explícita para os objetos e modificações concretas.
4. EXECUTE: somente com ferramenta/ACL apropriada; coletar IDs e retornos reais.
5. VERIFY: dado na origem, query/dashboard, time range, timestamp; alertas e regressões.
6. REPORT: produto e compliance separados; sem dado real, não marcar homologação PASS.

Não confundir build/CI PASS com qualidade funcional. Especialista relatar sucesso não equivale a phase evidence.

## Contrato de relatório

WORKFLOW COMPLEXITY: SIMPLE | STANDARD | COMPLEX
AGENTIC EXECUTION: AVAILABLE | PARTIAL | UNAVAILABLE | UNKNOWN
DELEGATION TOPOLOGY: ROOT_ROUTED | DIRECT_ONLY | UNKNOWN
TOOL EXECUTION: ROOT_PROXY | SPECIALIST_DIRECT | MIXED | UNKNOWN
OBJECT IDs: comprovados | UNKNOWN
APPROVAL: REQUIRED | GRANTED | NOT NEEDED
EXECUTION: EXECUTED | NOT EXECUTED | BLOCKED
OFFLINE TEST: PASS | FAIL | NOT EXECUTED
FUNCTIONAL TEST: PASS | FAIL | NOT EXECUTED | BLOCKED
ROLLBACK: definido | N/A | PENDENTE
PRODUCT QUALITY: READY | READY WITH WARNINGS | BLOCKED
TOOLKIT COMPLIANCE: COMPLIANT | PARTIAL | FAILED | UNKNOWN

As instruções de skills são guardrails textuais, não substituem autorização RBAC, execução em sandbox ou aprovação das ferramentas.

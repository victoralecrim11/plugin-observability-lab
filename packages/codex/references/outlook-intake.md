# Intake de demandas por e-mail corporativo

Outlook/Exchange **não é uma fonte nativa de pesquisa automática dentro do NotebookLM**. A instalação do conector Microsoft corporativo depende de autorização do administrador; não contorne.

Workflow aprovado para futuro uso: buscar via recurso corporativo **autorizado** (Microsoft Graph / Power Automate / e-mail exportado), filtrar por assunto e remetente, identificar anexos permitidos, gerar resumo **sanitizado** em repositório autorizado e só então importar esse documento como fonte mediante política da empresa.

Não habilitar espelhamento completo da caixa corporativa para Google pessoal; não inserir tokens, URLs internas, nomes de pessoas ou mensagens confidenciais em repositórios públicos. Este plugin inclui somente especificação do fluxo, **não conector Outlook nem rotina de coleta automática**.

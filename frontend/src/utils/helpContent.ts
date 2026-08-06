export interface HelpContent {
    title: string;
    description: string;
    icon?: string;
}

export const helpContents: Record<string, HelpContent> = {
    // ── PRINCIPAL ───────────────────────────────────────────────────
    'dashboard': {
        title: 'Dashboard',
        description: '🎯 Objetivo: Acompanhar indicadores e métricas da produção em tempo real.\n\n💡 Finalidade: Fornecer uma visão geral do andamento das ordens de serviço e do desempenho operacional da fábrica.',
        icon: '📊'
    },

    // ── CADASTROS ───────────────────────────────────────────────────
    'pessoa-juridica': {
        title: 'Pessoa Jurídica',
        description: '🎯 Objetivo: Cadastrar e gerenciar clientes, fornecedores e parceiros comerciais.\n\n💡 Finalidade: Manter a base de dados de entidades empresariais atualizada para uso em faturamentos, romaneios e ordens de serviço.',
        icon: '🏢'
    },
    'monta-peca-manufaturada': {
        title: 'Montagem Processo Fabricação',
        description: '🎯 Objetivo: Definir processos fabris e estruturar a composição dos materiais.\n\n💡 Finalidade: Vincular insumos aos processos e criar o roteiro de produção, garantindo a correta montagem do item.',
        icon: '⚙️'
    },
    'peca-manufaturada': {
        title: 'Montagem Processo Fabricação',
        description: '🎯 Objetivo: Definir processos fabris e estruturar a composição dos materiais.\n\n💡 Finalidade: Vincular insumos aos processos e criar o roteiro de produção, garantindo a correta montagem do item.',
        icon: '⚙️'
    },
    'peça-manufaturada': {
        title: 'Montagem Processo Fabricação',
        description: '🎯 Objetivo: Definir processos fabris e estruturar a composição dos materiais.\n\n💡 Finalidade: Vincular insumos aos processos e criar o roteiro de produção, garantindo a correta montagem do item.',
        icon: '⚙️'
    },
    'unidades-medida': {
        title: 'Unidades de Medida',
        description: '🎯 Objetivo: Cadastrar as grandezas matemáticas de estoque e produção.\n\n💡 Finalidade: Padronizar as unidades (kg, m, un, etc.) para garantir cálculos precisos em ordens de serviço e consumo de material.',
        icon: '📐'
    },
    'familia': {
        title: 'Família de Produtos',
        description: '🎯 Objetivo: Cadastrar e gerenciar as famílias de produtos do sistema.\n\n💡 Finalidade: Organizar os materiais e itens em categorias lógicas, facilitando a busca e estruturação do banco de dados de produtos da empresa.',
        icon: '🗂️'
    },
    'acabamento': {
        title: 'Tipos de Acabamento',
        description: '🎯 Objetivo: Gerenciar os tipos de tratamento superficial disponíveis.\n\n💡 Finalidade: Especificar pintura, zincagem e outros tratamentos que devem ser aplicados às peças durante o processo de fabricação.',
        icon: '🎨'
    },
    'materiais': {
        title: 'Materiais',
        description: '🎯 Objetivo: Manter o catálogo de matérias-primas, chapas e insumos.\n\n💡 Finalidade: Disponibilizar informações técnicas e dimensionais para consumo em processos produtivos e planos de corte.',
        icon: '⚗️'
    },
    'tipos-produto': {
        title: 'Tipos Produto',
        description: '🎯 Objetivo: Classificar os produtos em categorias comerciais ou de produção.\n\n💡 Finalidade: Manutenção de Tipo de Produto.',
        icon: '🏷️'
    },
    'tipos-transporte': {
        title: 'Tipos Transporte',
        description: '🎯 Objetivo: Gerenciar a frota e as modalidades de entrega.\n\n💡 Finalidade: Manutenção Tipo de Transportes a ser usado principalmente em relação a envio ou retorno de Romaneio para fora da empresa.',
        icon: '🚚'
    },
    'pesquisar-desenho': {
        title: 'Pesquisar Desenho',
        description: '🎯 Objetivo: Buscar especificações técnicas e pranchas de projeto.\n\n💡 Finalidade: Exibir dados de desenhos catalogados nos processos ativos.',
        icon: '🔍'
    },
    'projetos': {
        title: 'Projetos',
        description: '🎯 Objetivo: Agrupar ordens de serviço e tags sob um mesmo contrato ou obra.\n\n💡 Finalidade: Manutenção de projetos possibilitando alem de criação de Tags para este projeto.',
        icon: '🏗️'
    },
    'producao-diaria-recurso': {
        title: 'Produção Diaria Recurso',
        description: '🎯 Objetivo: Configurar a capacidade de produção.\n\n💡 Finalidade: Gerenciar Limite diário em minutos para cada recurso de processo.',
        icon: '📈'
    },
    'recurso-fabricacao': {
        title: 'Recurso de Fabricação',
        description: '🎯 Objetivo: Administrar os recursos fabris disponíveis.\n\n💡 Finalidade: Manutenção de recursos posteriormente usados para montar processo de fabricação de um item em uma Ordem de Serviço.',
        icon: '🏭'
    },

    // ── ORDENS DE SERVIÇO ───────────────────────────────────────────
    'criar-ordem-servico': {
        title: 'Criar Ordem Serviço',
        description: '🎯 Objetivo: Cadastrar novas ordens de serviço no sistema.\n\n💡 Finalidade: Criar Ordem de serviço e possibilidade de incluir ou não itens na ordem de serviço criada.',
        icon: '📝'
    },
    'ordens-servico': {
        title: 'Ordens de Serviço (O.S.)',
        description: '🎯 Objetivo: Gerenciar e acompanhar as ordens de serviço existentes.\n\n💡 Finalidade: Consultar o status, atualizar informações e auditar os processos de fabricação demandados para cada item.',
        icon: '📋'
    },

    // ── PLANO DE CORTE ──────────────────────────────────────────────
    'lista-plano-corte': {
        title: 'Lista de Planos de Corte',
        description: '🎯 Objetivo: Visualizar os planos de agrupamento de peças em chapas.\n\n💡 Finalidade: Orientar os operadores de corte sobre o melhor aproveitamento do material, reduzindo sobras e retalhos.',
        icon: '✂️'
    },
    'novo-plano-corte': {
        title: 'Novo Plano de Corte',
        description: '🎯 Objetivo: Gerar o aproveitamento otimizado de chapas.\n\n💡 Finalidade: Calcular matematicamente como as peças serão cortadas, otimizando o uso da matéria-prima antes da produção iniciar.',
        icon: '✨'
    },

    // ── PRODUÇÃO / FÁBRICA ──────────────────────────────────────────
    'apontamentos': {
        title: 'Apontamento Principal',
        description: '🎯 Objetivo: Registrar a conclusão das etapas produtivas (corte, solda, etc).\n\n💡 Finalidade: Atualizar o andamento da O.S. em tempo real e fornecer dados sobre a produtividade da equipe e dos setores.',
        icon: '⏱️'
    },
    'apontamento-producao-recurso': {
        title: 'Apontamento Produção Recurso',
        description: '🎯 Objetivo: Acompanhar o processo produtivo por recurso.\n\n💡 Finalidade: Exibir etapas de processo de um item e apontar as quantidades executadas destes recursos, mantendo um controle visual de todo o processo que o item executa.',
        icon: '🏭'
    },
    'apontamentos-parciais': {
        title: 'Apontamentos Parciais',
        description: '🎯 Objetivo: Registrar pausas, inícios e interrupções durante um apontamento principal.\n\n💡 Finalidade: Medir o tempo líquido trabalhado e documentar motivos de paradas na operação (manutenção, falta de material).',
        icon: '⏸️'
    },
    'apontamento-perda': {
        title: 'Apontamento de Perdas',
        description: '🎯 Objetivo: Registrar sucatas, retrabalhos e falhas no material.\n\n💡 Finalidade: Documentar o descarte de peças, gerando informações para relatórios de qualidade e indicando a necessidade de reposição.',
        icon: '🗑️'
    },
    'setor-producao': {
        title: 'Setores de Produção',
        description: '🎯 Objetivo: Administrar os postos de trabalho e centros de custo fabris.\n\n💡 Finalidade: Definir quais áreas existem na fábrica (Dobra, Pintura, Solda) para organizar as filas de produção de cada etapa.',
        icon: '🏭'
    },
    'visao-geral-producao': {
        title: 'Visão Geral da Produção',
        description: '🎯 Objetivo: Monitorar de forma ampla o andamento das O.S. no pátio de fábrica.\n\n💡 Finalidade: Permitir que os líderes acompanhem quais peças estão em atraso, quais setores estão sobrecarregados e organizem as prioridades do dia.',
        icon: '👀'
    },
    'acompanhamento-geral': {
        title: 'Acompanhamento Geral',
        description: '🎯 Objetivo: Exibir o progresso consolidado dos projetos e processos.\n\n💡 Finalidade: visão geral do projeto em todos os processos a ele relacionados. Mostrando percentual de execução em todos os setores.',
        icon: '📈'
    },
    'acompanhamento-projetos': {
        title: 'Acompanhamento de Projetos',
        description: '🎯 Objetivo: Exibir o progresso consolidado de um projeto inteiro.\n\n💡 Finalidade: Analisar o volume já fabricado frente ao total demandado, fornecendo previsibilidade de conclusão ao cliente.',
        icon: '📈'
    },
    'acompanhamento-etapas': {
        title: 'Visão Geral Engenharia',
        description: '🎯 Objetivo: Acompanhar os prazos de desenho e liberação técnica.\n\n💡 Finalidade: Controlar as etapas que antecedem a fabricação, garantindo que o projeto chegue à fábrica a tempo de ser executado.',
        icon: '🛠️'
    },

    // ── EXPEDIÇÃO ────────────────────────────────────────────────────
    'romaneio-envio': {
        title: 'Romaneio de Envio',
        description: '🎯 Objetivo: Gerar a lista oficial de embarque e consolidação de carga.\n\n💡 Finalidade: Registrar a saída dos produtos finalizados para entrega, garantindo a rastreabilidade e suporte para emissão de notas fiscais.',
        icon: '🚚'
    },
    'romaneio-retorno': {
        title: 'Romaneio de Retorno',
        description: '🎯 Objetivo: Recepcionar peças e lotes que haviam saído para terceirização.\n\n💡 Finalidade: Dar entrada no pátio de itens que passaram por processos externos, atualizando o estoque e liberando o fluxo subsequente.',
        icon: '↩️'
    },
    'controle-expedicao': {
        title: 'Controle de Expedição',
        description: '🎯 Objetivo: Monitorar os faturamentos e o envio das peças ao cliente final.\n\n💡 Finalidade: Acompanhar os romaneios abertos e entregues para assegurar que todas as O.S. concluídas saiam da fábrica dentro do prazo.',
        icon: '📦'
    },
    'pendencia-romaneio': {
        title: 'Pendências do Romaneio',
        description: '🎯 Objetivo: Registrar desvios e ocorrências nos embarques.\n\n💡 Finalidade: Organizar itens faltantes ou com defeito relatados no momento da expedição, permitindo agilidade na reposição.',
        icon: '⚠️'
    },

    // ── QUALIDADE / PENDÊNCIAS ───────────────────────────────────────
    'visao-geral-pendencias': {
        title: 'Todas as Pendências',
        description: '🎯 Objetivo: Listar as Não-Conformidades abertas e problemas de qualidade.\n\n💡 Finalidade: Visualização daspendencias de varias origens e finalizar estas pendencias.',
        icon: '🔎'
    },
    'pecas-reposicao': {
        title: 'Peças em Reposição',
        description: '🎯 Objetivo: Administrar as ordens de serviço geradas para refazer sucatas.\n\n💡 Finalidade: Controlar o fluxo de itens que precisaram ser reprocessados para completar o lote de um projeto.',
        icon: '🔄'
    },

    // ── TESTE FINAL ──────────────────────────────────────────────────
    'inspecao-final': {
        title: 'Inspeção Final',
        description: '🎯 Objetivo: Homologar os produtos antes da embalagem e faturamento.\n\n💡 Finalidade: Garantir que todas as medidas e acabamentos atendam às exigências do cliente, prevenindo devoluções em obra.',
        icon: '✅'
    },
    'teste-final-montagem': {
        title: 'Teste Final Montagem',
        description: '🎯 Objetivo: Avaliar o status de componentes antes da expedição.\n\n💡 Finalidade: Identificar e testar produtos para posterior envio.',
        icon: '⚙️'
    },

    // ── IMPORTAÇÃO E POWERBUILD ──────────────────────────────────────
    'blockset': {
        title: 'Importação Blockset',
        description: '🎯 Objetivo: Importar planilhas técnicas diretamente do software CAD.\n\n💡 Finalidade: Automatizar a criação do cadastro de peças, evitando a necessidade de digitar dados operacionais manualmente.',
        icon: '🤖'
    },
    'leitura-dados': {
        title: 'Leitura de Dados',
        description: '🎯 Objetivo: Importar listas e metadados de projetos via CSV ou XLS.\n\n💡 Finalidade: Facilitar a inserção em massa de dados de clientes, criando estruturas complexas de produtos de forma rápida.',
        icon: '🤖'
    },
    'lista-planilhas': {
        title: 'Lista de Planilhas',
        description: '🎯 Objetivo: Manter o histórico das planilhas que já foram importadas no sistema.\n\n💡 Finalidade: Permitir o rastreamento das integrações feitas e possibilitar a auditoria de projetos inseridos em lote.',
        icon: '📑'
    },
    'powerbuild-list': {
        title: 'Lista PowerBuild',
        description: '🎯 Objetivo: Exibir o histórico de automações de dados originados do PowerBuild.\n\n💡 Finalidade: Rastrear cargas de metadados proprietários geradas pelas rotinas automatizadas de desenho.',
        icon: '📑'
    },
    'revisao-itens': {
        title: 'Revisão de Itens',
        description: '🎯 Objetivo: Validar e higienizar os dados importados antes da produção.\n\n💡 Finalidade: Corrigir inconsistências em chapas e materiais vindos do CAD, evitando que requisições impossíveis sejam processadas.',
        icon: '🔍'
    },
    'powerbuild-revision': {
        title: 'Revisão PowerBuild',
        description: '🎯 Objetivo: Validar os dados específicos gerados pelo PowerBuild.\n\n💡 Finalidade: Ajustar espessuras e propriedades das peças oriundas da integração robótica antes de irem para corte.',
        icon: '🔍'
    },
    'visualizacao-aglutinacao': {
        title: 'Aglutinação de Itens',
        description: '🎯 Objetivo: Agrupar itens matematicamente idênticos que entraram no sistema.\n\n💡 Finalidade: Reduzir ordens repetidas no chão de fábrica e unificá-las para corte e produção otimizados.',
        icon: '🔗'
    },
    'powerbuild-agglutination': {
        title: 'Aglutinação PowerBuild',
        description: '🎯 Objetivo: Agrupar peças lógicas oriundas da rotina PowerBuild.\n\n💡 Finalidade: Compactar matrizes semelhantes em uma única etapa produtiva para poupar setup de máquinas.',
        icon: '🔗'
    },

    // ── ADMINISTRATIVO E CONFIGURAÇÃO ───────────────────────────────
    'usuarios': {
        title: 'Usuários do Sistema',
        description: '🎯 Objetivo: Gerenciar todas as contas e permissões do sistema.\n\n💡 Finalidade: Definir perfis de acesso, bloqueios e garantir que a visibilidade de dados fique restrita a quem precisa.',
        icon: '👥'
    },
    'cadastro-de-usuario': {
        title: 'Cadastro de Usuário',
        description: '🎯 Objetivo: Criar novos acessos e designar níveis hierárquicos.\n\n💡 Finalidade: Controlar exatamente o que cada funcionário pode fazer nas telas administrativas e do pátio.',
        icon: '👤'
    },
    'cadastro-usuario': {
        title: 'Cadastro de Usuário',
        description: '🎯 Objetivo: Criar novos acessos e designar níveis hierárquicos.\n\n💡 Finalidade: Controlar exatamente o que cada funcionário pode fazer nas telas administrativas e do pátio.',
        icon: '👤'
    },
    'group_1775495483371': {
        title: 'Cadastro de Usuário',
        description: '🎯 Objetivo: Criar novos acessos e designar níveis hierárquicos.\n\n💡 Finalidade: Controlar exatamente o que cada funcionário pode fazer nas telas administrativas e do pátio.',
        icon: '👤'
    },
    'config': {
        title: 'Configurações do Sistema',
        description: '🎯 Objetivo: Ajustar as preferências do usuário no sistema.\n\n💡 Finalidade: Definir modo escuro, volume de carregamento de tabelas e personalizações ergonômicas de interface.',
        icon: '⚙️'
    },
    'config-sistema': {
        title: 'Configurações Avançadas',
        description: '🎯 Objetivo: Controlar limites, integrações externas e comportamentos base do app.\n\n💡 Finalidade: Tratar de parâmetros técnicos sensíveis usados pela diretoria e administradores do ERP.',
        icon: '⚙️'
    },
    'superadmin': {
        title: 'Painel Superadministrador',
        description: '🎯 Objetivo: Gerenciar as bases de dados e filiais (Multi-tenant).\n\n💡 Finalidade: Centralizar as configurações operacionais para implantação do sistema em novas instâncias ou clientes (SaaS).',
        icon: '👑'
    },
    'tarefas': {
        title: 'Tarefas',
        description: '🎯 Objetivo: Acompanhar os chamados e tickets internos da fábrica.\n\n💡 Finalidade: Organizar requisições de manutenção, consertos em TI ou melhorias processuais através de um Kanban interno.',
        icon: '📋'
    },
    'relatorios': {
        title: 'Relatórios',
        description: '🎯 Objetivo: Gerar extrações e totalizadores numéricos da operação.\n\n💡 Finalidade: Apresentar resultados precisos para decisões táticas, análise contábil e auditoria financeira de processos.',
        icon: '📊'
    },

    'montagem-plano-corte': {
        title: 'Montagem Plano de Corte',
        description: '🎯 Objetivo: Agrupar itens de ordens de serviço.\n\n💡 Finalidade: Unir itens que tenham mesma espessura e material e formar um plano de corte , evitando desperdiçio de chaparia.',
        icon: '✂️'
    },
    'producao-plano-corte': {
        title: 'Produção Plano de Corte',
        description: '🎯 Objetivo: Gerenciar execução do plano de corte no chão de fábrica.\n\n💡 Finalidade: Liberar e apontar itens incluidos em plano de corte pre-definido.',
        icon: '🏭'
    },

    // ── FALLBACK ────────────────────────────────────────────────────
    'default': {
        title: 'Sobre esta Tela',
        description: '🎯 Objetivo: Funcionalidade genérica e gerenciamento do módulo atual.\n\n💡 Finalidade: Apoiar o usuário em processos básicos de Busca, Adição, Exclusão e Atualização dos registros.',
        icon: '🧭'
    }
};

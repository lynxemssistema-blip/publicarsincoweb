export interface HelpContent {
    title: string;
    description: string;
    icon?: string;
}

export const helpContents: Record<string, HelpContent> = {

    // ── PRINCIPAL ───────────────────────────────────────────────────
    'dashboard': {
        title: 'Dashboard',
        description: '🎯 Objetivo: Consolidar métricas, indicadores-chave de desempenho (KPIs) e o status atual das O.S. abertas em uma única visão panorâmica.\n\n💡 Finalidade: Permitir que a diretoria e gestão tomem decisões rápidas e assertivas baseadas em dados em tempo real, diagnosticando se o ritmo produtivo da fábrica está atingindo a meta financeira e operacional do dia.',
        icon: '📊'
    },

    // ── CADASTROS ───────────────────────────────────────────────────
    'pessoa-juridica': {
        title: 'Pessoa Jurídica',
        description: '🎯 Objetivo: Gerenciar a base de dados de entidades empresariais, como clientes, fornecedores e parceiros.\n\n💡 Finalidade: Garantir que todas as transações fiscais e de logística (Romaneios, faturamentos) sejam direcionadas às entidades legais corretas, mantendo a rastreabilidade financeira e o histórico de relacionamento.',
        icon: '🏢'
    },
    'monta-peca-manufaturada': {
        title: 'Peça Manufaturada',
        description: '🎯 Objetivo: Mapear a "Árvore do Produto" (BOM - Bill of Materials) e o seu roteiro de fabricação, vinculando insumos aos setores produtivos.\n\n💡 Finalidade: Parametrizar a receita exata de como um produto final é feito, garantindo que o chão de fábrica execute o processo padrão todas as vezes, evitando erros de montagem e calculando custos precisamente.',
        icon: '📦'
    },
    'group_1781618991422': {
        title: 'Peça Manufaturada',
        description: '🎯 Objetivo: Mapear a "Árvore do Produto" (BOM - Bill of Materials) e o seu roteiro de fabricação, vinculando insumos aos setores produtivos.\n\n💡 Finalidade: Parametrizar a receita exata de como um produto final é feito, garantindo que o chão de fábrica execute o processo padrão todas as vezes, evitando erros de montagem e calculando custos precisamente.',
        icon: '📦'
    },
    'unidades-medida': {
        title: 'Unidades de Medida',
        description: '🎯 Objetivo: Definir e padronizar as grandezas matemáticas de estoque e produção.\n\n💡 Finalidade: Prevenir falhas críticas de faturamento e estocagem (como comprar em Tonelada e consumir em Quilograma), mantendo a integridade dos cálculos dimensionais da plataforma.',
        icon: '📐'
    },
    'familia': {
        title: 'Família de Produtos',
        description: '🎯 Objetivo: Categorizar materiais e produtos em grupos semânticos hierárquicos.\n\n💡 Finalidade: Facilitar a emissão de relatórios gerenciais focados em lucratividade por segmento de negócio, permitindo descobrir rapidamente quais categorias industriais rendem mais lucro.',
        icon: '🗂️'
    },
    'acabamento': {
        title: 'Tipos de Acabamento',
        description: '🎯 Objetivo: Cadastrar os tipos de tratamento superficial ou estético disponíveis para o aço.\n\n💡 Finalidade: Determinar a rota final das peças (como a ida à terceiros para galvanização), influenciando o prazo de entrega final e os requisitos de embalagem do produto.',
        icon: '🎨'
    },
    'materiais': {
        title: 'Materiais',
        description: '🎯 Objetivo: Alimentar o catálogo mestre de todas as matérias-primas e insumos com pesos e dimensões literais.\n\n💡 Finalidade: Fornecer os dados dimensionais exatos exigidos pelo algoritmo de Plano de Corte e garantir a exatidão no Romaneio para peso em balança rodoviária.',
        icon: '⚗️'
    },
    'tipos-produto': {
        title: 'Tipos de Produto',
        description: '🎯 Objetivo: Subdividir contabilmente os bens industriais da empresa (ex: Comercialização, Industrialização).\n\n💡 Finalidade: Garantir o enquadramento fiscal correto para a emissão de NF-e e definir a natureza de operação de saída (CFOP) automática.',
        icon: '🏷️'
    },
    'projetos': {
        title: 'Projetos',
        description: '🎯 Objetivo: Ser a entidade agregadora máxima das frentes de obra ou grandes contratos.\n\n💡 Finalidade: Agrupar financeiramente e temporalmente centenas de O.S. espalhadas, permitindo apurar o Custo Total do Contrato versus o Faturamento Total por Cliente.',
        icon: '🏗️'
    },

    // ── ORDENS DE SERVIÇO ───────────────────────────────────────────
    'criar-ordem-servico': {
        title: 'Criar Ordem Serviço',
        description: '🎯 Objetivo: Traduzir a necessidade de vendas ou engenharia em um documento autorizativo (O.S.).\n\n💡 Finalidade: Disparar o ciclo fabril, inserindo a peça oficialmente na fila do apontamento de produção, cobrando do chão de fábrica um prazo e quantidade estipulados.',
        icon: '📝'
    },
    'ordens-servico': {
        title: 'Ordens de Serviço (O.S.)',
        description: '🎯 Objetivo: Administrar o documento matriz que instrui e acompanha a fabricação de lotes.\n\n💡 Finalidade: Possibilitar auditoria instantânea do que foi demandado versus o que foi realizado, arquivando anexos (DXF/PDF) e servindo de prova documental do histórico produtivo.',
        icon: '📋'
    },

    // ── PLANO DE CORTE ──────────────────────────────────────────────
    'montagem-plano-corte': {
        title: 'Montagem do Plano de Corte',
        description: '🎯 Objetivo: Agrupar digitalmente diversas Ordens de Serviço que compartilham da mesma matéria-prima (espessura e tipo de material) em lotes unificados.\n\n💡 Finalidade: Otimizar o aproveitamento da chapa de aço e evitar setups redundantes nas máquinas de corte (laser/plasma), economizando tempo de máquina e minimizando o desperdício (sucata).',
        icon: '✂️'
    },
    'producao-plano-corte': {
        title: 'Produção do Plano de Corte',
        description: '🎯 Objetivo: Registrar a baixa consumada do lote cortado pelos operadores de Guilhotina ou Laser.\n\n💡 Finalidade: Distribuir automaticamente as peças recém-cortadas para as filas subsequentes (Dobra, Solda), destravando a produção das próximas etapas com rastreabilidade real.',
        icon: '🪚'
    },

    // ── APONTAMENTO ─────────────────────────────────────────────────
    'apontamento-producao-recurso': {
        title: 'Apontamento Produção Recurso',
        description: '🎯 Objetivo: Interface rápida de apontamento dedicada exclusivamente a uma máquina ou recurso específico.\n\n💡 Finalidade: Facilitar a vida do operador que passa o turno inteiro num único maquinário, tornando as interações via tablet ágeis e menos suscetíveis a erros humanos.',
        icon: '⚙️'
    },
    'apontamento': {
        title: 'Apontamento de Produção',
        description: '🎯 Objetivo: Realizar a transição formal das O.S. entre os setores (Corte, Dobra, Solda).\n\n💡 Finalidade: Ditar o ritmo da fábrica (Takt Time). O apontamento é o pulso da empresa, liberando peças boas, reportando peças ruins (RNCs) e movimentando a estatística global.',
        icon: '⚙️'
    },
    'apontamentos-parciais': {
        title: 'Apontamentos Parciais',
        description: '🎯 Objetivo: Identificar saldos remanescentes (O.S. não terminadas 100% num único turno).\n\n💡 Finalidade: Prevenir o esquecimento de peças na fábrica. Ele rastreia "pontas soltas" que seguram faturamentos grandes, forçando os líderes a liquidarem os saldos.',
        icon: '🔢'
    },

    // ── ACOMPANHAMENTO ───────────────────────────────────────────────
    'acompanhamento-geral': {
        title: 'Acompanhamento Geral',
        description: '🎯 Objetivo: Prover uma linha do tempo macro, calculando percentuais de avanço globais de Projetos e Tags.\n\n💡 Finalidade: Responder rapidamente à pergunta do Cliente: "A minha obra está em quantos %?". A interface gera dados consolidados prontos para envio às medições.',
        icon: '📈'
    },
    'visao-geral-producao': {
        title: 'Visão Geral Produção',
        description: '🎯 Objetivo: Mapear detalhadamente o posicionamento exato de cada Ordem de Serviço dentro dos buffers (filas) de todos os setores produtivos.\n\n💡 Finalidade: Dar poder tático ao chefe de fábrica para remanejar recursos físicos, destravando gargalos antes que afetem o prazo de entrega, garantindo a fluidez contínua do chão de fábrica.',
        icon: '🏭'
    },
    'visao-geral-engenharia': {
        title: 'Visão Geral Engenharia',
        description: '🎯 Objetivo: Controlar o "Projeto antes do Projeto", gerenciando prazos de desenho e modelagem.\n\n💡 Finalidade: Impedir que os desenhistas virem o gargalo da produção. O controle assegura que o projeto chegará à fábrica aprovado e a tempo de ser cortado.',
        icon: '🛠️'
    },
    'acompanhamento-etapas': {
        title: 'Visão Geral Engenharia',
        description: '🎯 Objetivo: Controlar o "Projeto antes do Projeto", gerenciando prazos de desenho e modelagem.\n\n💡 Finalidade: Impedir que os desenhistas virem o gargalo da produção. O controle assegura que o projeto chegará à fábrica aprovado e a tempo de ser cortado.',
        icon: '🛠️'
    },

    // ── EXPEDIÇÃO ────────────────────────────────────────────────────
    'romaneio-envio': {
        title: 'Romaneio de Envio',
        description: '🎯 Objetivo: Criar a consolidação lógica de faturamento, gerando o Packing List (lista de embarque).\n\n💡 Finalidade: Garantir que nenhuma peça pronta fique esquecida na doca. A formalização protege a indústria ao gerar comprovação legal e código de barras do que subiu no caminhão.',
        icon: '🚚'
    },
    'romaneio-retorno': {
        title: 'Romaneio de Retorno',
        description: '🎯 Objetivo: Recepcionar fisicamente O.S. que haviam saído para terceirizados (como zincagem).\n\n💡 Finalidade: Impedir perdas de inventário (extravio de aço na rua) e sinalizar à empresa que o item final já está disponível no pátio para embarque final.',
        icon: '↩️'
    },
    'controle-expedicao': {
        title: 'Controle de Expedição',
        description: '🎯 Objetivo: Manter rastreio das cargas em trânsito e o histórico das notas finalizadas.\n\n💡 Finalidade: Servir como base jurídica e financeira. Ajuda o suporte a rastrear rotas e confirmar entregas caso clientes acusem ausência de peças em obra.',
        icon: '📦'
    },
    'pendencia-romaneio': {
        title: 'Pendências do Romaneio',
        description: '🎯 Objetivo: Catalogar reincidências de problemas logísticos e devoluções na obra.\n\n💡 Finalidade: Agir como escudo financeiro contra multas de cliente, acionando rapidamente a fábrica (RNCs) para sanar falhas logísticas reportadas pelo caminhoneiro.',
        icon: '⚠️'
    },

    // ── QUALIDADE / PENDÊNCIAS ───────────────────────────────────────
    'visao-geral-pendencias': {
        title: 'Visão Geral de Pendências (RNC)',
        description: '🎯 Objetivo: Painel do inspetor de Qualidade. Concentra os apontamentos de falhas detectadas na linha.\n\n💡 Finalidade: Prover base para os padrões ISO 9001 (Relatórios de Não-Conformidade). Permite mensurar que setor mais gera sucata, embasando treinamentos e demissões.',
        icon: '🔎'
    },
    'pecas-reposicao': {
        title: 'Peças em Reposição',
        description: '🎯 Objetivo: Criar atalhos paralelos ("mini O.S.") para compensar perdas no processo (scrap).\n\n💡 Finalidade: Fechar pedidos pendentes (faltantes). Sem esta ferramenta, a O.S. mãe ficaria retida eternamente, prejudicando o faturamento do projeto por causa de 1 peça estragada.',
        icon: '🔄'
    },

    // ── TESTE FINAL ──────────────────────────────────────────────────
    'teste-final-montagem': {
        title: 'Teste Final de Montagem',
        description: '🎯 Objetivo: O "Check-out Final" antes do embarque. Inspeção visual ou física.\n\n💡 Finalidade: Barreira final de qualidade. Retém componentes que estouraram limites de tolerância antes de saírem para a rua, protegendo a reputação da empresa e evitando caríssimas viagens de regresso.',
        icon: '✅'
    },

    // ── DESENHOS / DOCUMENTOS ────────────────────────────────────────
    'pesquisar-desenho': {
        title: 'Pesquisar Desenho Técnico',
        description: '🎯 Objetivo: Motor de busca instantâneo para PDFs industriais de qualquer peça da base.\n\n💡 Finalidade: Executar a "Fábrica Sem Papel" (Paperless), garantindo que operadores no tablet visualizem SEMPRE a última versão homologada, liquidando erros por uso de plantas obsoletas.',
        icon: '📐'
    },

    // ── PLANEJAMENTO ─────────────────────────────────────────────────
    'visao-geral-tags': {
        title: 'Visão Geral de Tags Globais',
        description: '🎯 Objetivo: Controlar e recalcular (em massa) os prazos temporais das obras.\n\n💡 Finalidade: Adaptabilidade frente às falhas do cliente civil (Ex: chuvas na obra que atrasam a entrega estrutural). Permite à fábrica realocar toda a programação fabril num clique sem sujar relatórios.',
        icon: '🏷️'
    },

    // ── IMPORTAÇÃO E POWERBUILD ──────────────────────────────────────
    'blockset': {
        title: 'Importação Blockset',
        description: '🎯 Objetivo: Digerir macros (XLS) exportadas cruas de hardwares CAD (SolidWorks).\n\n💡 Finalidade: Eliminar 100% da digitação humana no cadastramento das chapas, liquidando o risco de "Ded-Fingers" (erro de digitação) e otimizando o setup em dezenas de horas semanais.',
        icon: '📤'
    },
    'leitura-dados': {
        title: 'Leitura de Dados',
        description: '🎯 Objetivo: Ferramenta agnóstica de Ingestão de planilhas CSV/XLS legadas.\n\n💡 Finalidade: Facilitar o "Onboarding" de novos projetos na plataforma de clientes que ainda operam de maneira engessada e não possuem os robôs de CAD da SINCO.',
        icon: '📥'
    },
    'lista-planilhas': {
        title: 'Lista de Planilhas',
        description: '🎯 Objetivo: Registro inviolável (Log) de tudo que já foi processado.\n\n💡 Finalidade: Proporcionar compliance na importação. Permite rastrear qual Engenheiro importou a peça incorreta e acionar botões de rollback em caso de acidentes de projeto.',
        icon: '📑'
    },
    'powerbuild-list': {
        title: 'Lista PowerBuild',
        description: '🎯 Objetivo: Semelhante ao Log de Planilhas, focado nas automações estruturais exclusivas.\n\n💡 Finalidade: Assegurar o armazenamento do histórico de pacotes de dados proprietários que não existem nos métodos clássicos de manufatura.',
        icon: '📑'
    },
    'revisao-itens': {
        title: 'Revisão de Itens',
        description: '🎯 Objetivo: Estágio de triagem provisória das importações antes da ida à fábrica.\n\n💡 Finalidade: Limpar e higienizar metadados oriundos do CAD, pareando chapas e tubos estranhos com o banco de estoque homologado, impedindo que requisições fictícias derrubem o algoritmo.',
        icon: '🔍'
    },
    'powerbuild-revision': {
        title: 'Revisão PowerBuild',
        description: '🎯 Objetivo: Interface de triagem e pareamento lógico focada na arquitetura PowerBuild.\n\n💡 Finalidade: Higienizar nomenclaturas exclusivas do PowerBuild, validando espessuras e medidas cruciais para que o software não emita Ordens inexecutáveis para as guilhotinas.',
        icon: '🔍'
    },
    'visualizacao-aglutinacao': {
        title: 'Aglutinação de Itens',
        description: '🎯 Objetivo: Fundir clones digitais gerados excessivamente por erro do CAD.\n\n💡 Finalidade: Evitar o aborrecimento e perda de tempo do cortador de chapa, unificando O.S. matematicamente idênticas antes de chegarem à área fabril primária.',
        icon: '🔗'
    },
    'powerbuild-agglutination': {
        title: 'Aglutinação PowerBuild',
        description: '🎯 Objetivo: Fundir clones lógicos oriundos da geração robótica PowerBuild.\n\n💡 Finalidade: Compactar matrizes idênticas para a usinagem economizar material e tempo operacional, acelerando sensivelmente a logística dentro do galpão.',
        icon: '🔗'
    },

    // ── ADMINISTRATIVO E CONFIGURAÇÃO ───────────────────────────────
    'usuarios': {
        title: 'Usuários do Sistema',
        description: '🎯 Objetivo: Controle base de identidades e permissões de acesso ao ERP.\n\n💡 Finalidade: Estabelecer a segurança e os silos de informação (ninguém vê mais do que precisa). Quando bloqueados, retém histórico inalterável de suas ações fabris.',
        icon: '👥'
    },
    'cadastro-de-usuario': {
        title: 'Cadastro de Usuário',
        description: '🎯 Objetivo: Criação de perfis, hierarquias e permissões operacionais estritas.\n\n💡 Finalidade: Limitar a interface do tablet. Garante que um "Soldador" não faça apontamentos na "Guilhotina", impondo disciplina cega (fool-proof) no input de dados do pátio.',
        icon: '👤'
    },
    'cadastro-usuario': {
        title: 'Cadastro de Usuário',
        description: '🎯 Objetivo: Criação de perfis, hierarquias e permissões operacionais estritas.\n\n💡 Finalidade: Limitar a interface do tablet. Garante que um "Soldador" não faça apontamentos na "Guilhotina", impondo disciplina cega (fool-proof) no input de dados do pátio.',
        icon: '👤'
    },
    'group_1775495483371': {
        title: 'Cadastro de Usuário',
        description: '🎯 Objetivo: Criação de perfis, hierarquias e permissões operacionais estritas.\n\n💡 Finalidade: Limitar a interface do tablet. Garante que um "Soldador" não faça apontamentos na "Guilhotina", impondo disciplina cega (fool-proof) no input de dados do pátio.',
        icon: '👤'
    },
    'config': {
        title: 'Configurações do Sistema',
        description: '🎯 Objetivo: Opções subjetivas e preferências do navegador do usuário em sessão.\n\n💡 Finalidade: Melhorar a ergonomia do software (Dark Mode) ou baixar limites de carga (linhas nas tabelas) para aliviar equipamentos e computadores industriais mais lentos.',
        icon: '⚙️'
    },
    'config-sistema': {
        title: 'Configurações Avançadas',
        description: '🎯 Objetivo: Painel master de controle de limites, integrações externas e comportamento core.\n\n💡 Finalidade: Ajuste das "Leis da Física" do seu ERP. Apenas administradores devem modificar, pois as opções afetam tolerâncias matemáticas e emissões em tempo real.',
        icon: '🔧'
    },
    'superadmin': {
        title: 'Painel Superadministrador',
        description: '🎯 Objetivo: Hub restrito de orquestração (Multi-tenant) das filiais e bases SaaS.\n\n💡 Finalidade: Trata-se da central de faturamento do SINCO. Permite a ativação de novas plantas fabris sem derrubar o ecossistema principal. Invisível ao usuário padrão.',
        icon: '👑'
    },
    'tarefas': {
        title: 'Tarefas',
        description: '🎯 Objetivo: Kanban integrado nativamente dentro do sistema.\n\n💡 Finalidade: Substituir grupos informais por requisições rastreáveis e formais. Acelera resolução de defeitos nas plantas, pois os tickets ficam no mesmo software das O.S.',
        icon: '✅'
    },
    'relatorios': {
        title: 'Relatórios',
        description: '🎯 Objetivo: Motor gerador de extrações, totalizadores numéricos e PDFs.\n\n💡 Finalidade: Ponto focal contábil e tático da empresa. Envia relatórios prontos à diretoria ou à folha de pagamento, com resultados inquestionáveis extraídos direto do pátio.',
        icon: '📊'
    },

    // ── FALLBACK ─────────────────────────────────────────────────────
    'default': {
        title: 'Sobre esta Tela',
        description: '🎯 Objetivo: Abstração genérica das funcionalidades do módulo atual.\n\n💡 Finalidade: Orientar o usuário de maneira padronizada nas funções de Busca, Adição, Exclusão e Atualização (CRUD), garantindo usabilidade mínima em rotas não catalogadas.',
        icon: '📌'
    }
};

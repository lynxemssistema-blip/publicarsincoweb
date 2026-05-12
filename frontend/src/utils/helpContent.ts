export interface HelpContent {
    title: string;
    description: string;
}

export const helpContents: Record<string, HelpContent> = {
    'dashboard': {
        title: 'Sobre esta Tela',
        description: 'O objetivo dessa tela é dar a você um resumo rápido de tudo o que está acontecendo no sistema. É um painel de controle onde você vê atalhos fáceis e os números mais importantes da fábrica logo de cara.'
    },
    'ordens-servico': {
        title: 'Sobre esta Tela',
        description: 'O objetivo dessa tela é organizar o que precisa ser fabricado. É aqui que você cria e gerencia as Ordens de Serviço (O.S.), dizendo para o chão de fábrica exatamente o que deve ser feito e para quando.'
    },
    'projetos': {
        title: 'Sobre esta Tela',
        description: 'O objetivo dessa tela é cadastrar os grandes projetos ou obras da empresa. Ela serve para que você possa agrupar várias Ordens de Serviço debaixo de um mesmo cliente ou nome de projeto, mantendo tudo bem organizado.'
    },
    'apontamento': {
        title: 'Sobre esta Tela',
        description: 'O objetivo dessa tela é registrar o que está sendo feito na fábrica, em tempo real. O operador usa essa tela para avisar o sistema: "acabei de cortar esta peça" ou "terminei de soldar isso", fazendo a fila de trabalho andar.'
    },
    'apontamentos-parciais': {
        title: 'Sobre esta Tela',
        description: 'O objetivo dessa tela é rastrear peças que não foram produzidas em sua totalidade, mas sim em partes (quantidades parciais) em determinado setor da fábrica.'
    },
    'acompanhamento-geral': {
        title: 'Sobre esta Tela',
        description: 'O objetivo dessa tela é mostrar se a produção está atrasada ou adiantada. Ela usa gráficos visuais fáceis de entender para que a gerência veja onde a fábrica está engarrafada e o que já foi finalizado.'
    },
    'visao-geral-producao': {
        title: 'Sobre esta Tela',
        description: 'O objetivo dessa tela é guiar os líderes operacionais no dia a dia. Ela mostra a fila de trabalho exata de cada setor para hoje, ajudando a distribuir as tarefas para a equipe.'
    },
    'romaneio-envio': {
        title: 'Sobre esta Tela',
        description: 'O objetivo dessa tela é controlar tudo o que sai pelo portão da fábrica. Se você vai entregar peças para o cliente ou mandar para um serviço de terceiros (como galvanização), é aqui que você gera o documento oficial de saída.'
    },
    'blockset': {
        title: 'Sobre esta Tela',
        description: 'O objetivo dessa tela é importar listas de materiais (projetos) feitas pela engenharia no Excel. O sistema lê o arquivo, entende o que precisa ser fabricado e cria as Ordens de Serviço sem você precisar digitar peça por peça.'
    },
    'default': {
        title: 'Sobre esta Tela',
        description: 'O objetivo dessa tela é ajudar você a cadastrar, pesquisar ou organizar as informações específicas desta área do sistema. Use os botões em tela para adicionar novos dados ou as barras de pesquisa para encontrar algo na lista.'
    }
};

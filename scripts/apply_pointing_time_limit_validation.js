const fs = require('fs');

const pageFile = 'frontend/src/pages/ApontamentoProducaoRecurso.tsx';
const serverFile = 'src/server.js';

// 1. Update ApontamentoProducaoRecurso.tsx
let page = fs.readFileSync(pageFile, 'utf8');

const oldHandleSubmitValidation = `  // Submit apontamento
  const handleSubmit = async () => {
    if (!selectedItem || !itemDetails) return;

    const qProduzir = parseInt(qtdeApontar);

    if (!qtdeApontar || qProduzir <= 0) {
      addToast({ type: 'error', title: 'Atenção', message: 'Informe uma quantidade válida!' });
      return;
    }

    if (qProduzir > itemDetails.qtdeFaltante) {
      addToast({
        type: 'error',
        title: 'Atenção',
        message: \`A quantidade informada (\${qProduzir}) não poderá ser maior que o saldo a produzir (\${itemDetails.qtdeFaltante})!\`,
        duration: 5000
      });
      return;
    }`;

const newHandleSubmitValidation = `  // Submit apontamento com Validação de Limite de Tempo Diário por Recurso
  const handleSubmit = async () => {
    if (!selectedItem || !itemDetails) return;

    const qProduzir = parseInt(qtdeApontar, 10);

    if (!qtdeApontar || isNaN(qProduzir) || qProduzir <= 0) {
      addToast({ type: 'error', title: 'Atenção', message: 'Informe uma quantidade válida!' });
      return;
    }

    if (qProduzir > itemDetails.qtdeFaltante) {
      addToast({
        type: 'error',
        title: 'Atenção',
        message: \`A quantidade informada (\${qProduzir}) não poderá ser maior que o saldo a produzir (\${itemDetails.qtdeFaltante})!\`,
        duration: 5000
      });
      return;
    }

    // VALIDAÇÃO DE LIMITE MÁXIMO DE TEMPO DIÁRIO DO RECURSO
    if (modalSetor && modalSetor !== 'mapa') {
      const setorKey = String(modalSetor).toLowerCase();

      // Formatar busca de chaves para o recurso (ex: CorteTempoPadrao, GALVANIZARMinProd)
      const secFormatted = modalSetor.charAt(0).toUpperCase() + modalSetor.slice(1);
      const secUpper = modalSetor.toUpperCase();

      const tempoPadrao = parseFloat(String(
        itemDetails[\`\${secFormatted}TempoPadrao\`] ?? 
        itemDetails[\`\${modalSetor}TempoPadrao\`] ?? 
        itemDetails.TempoPadrao ?? 
        selectedItem[\`\${secFormatted}TempoPadrao\`] ?? 
        selectedItem.TempoPadrao ?? 
        0
      )) || 0;

      const tempoSetup = parseFloat(String(
        itemDetails[\`\${secFormatted}TempoSetup\`] ?? 
        itemDetails[\`\${modalSetor}TempoSetup\`] ?? 
        itemDetails.TempoSetup ?? 
        selectedItem[\`\${secFormatted}TempoSetup\`] ?? 
        selectedItem.TempoSetup ?? 
        0
      )) || 0;

      const minProdAtual = parseFloat(String(
        itemDetails[\`\${secFormatted}MinProd\`] ?? 
        itemDetails[\`\${secUpper}MinProd\`] ?? 
        itemDetails[\`\${modalSetor}MinProd\`] ?? 
        selectedItem[\`\${secFormatted}MinProd\`] ?? 
        selectedItem[\`\${secUpper}MinProd\`] ?? 
        0
      )) || 0;

      // Calculo = tempo padrao * quantidade digitada
      const tempoTotalApontamento = tempoPadrao * qProduzir;

      // Campo Auxiliar: se primeiro apontamento no dia (minProd == 0), inicializa com tempo de setup
      let campoAuxiliar = 0;
      if (minProdAtual === 0) {
        campoAuxiliar = tempoSetup + tempoTotalApontamento;
      } else {
        campoAuxiliar = minProdAtual + tempoTotalApontamento;
      }

      // Obter Limite Diário de Configurações (padrão 500 min)
      const limitesSalvos = JSON.parse(localStorage.getItem('sinco_limitesTempoSetores') || '{}');
      const limiteDiario = limitesSalvos[setorKey] ?? 500;

      if (campoAuxiliar > limiteDiario) {
        addToast({
          type: 'error',
          title: 'Limite Alcançado',
          message: \`Apontamento alcançou o limite máximo de tempo do dia para o recurso \${secFormatted} (\${campoAuxiliar} min > limite de \${limiteDiario} min)!\`,
          duration: 7000
        });
        setModalOpen(false); // Fecha o modal e não faz o processo de apontamento
        return;
      }
    }`;

page = page.replace(oldHandleSubmitValidation, newHandleSubmitValidation);
fs.writeFileSync(pageFile, page, 'utf8');
console.log(`✅ Updated ApontamentoProducaoRecurso.tsx with time limit validation logic`);

// 2. Update src/server.js to update MinProd on pointing
let server = fs.readFileSync(serverFile, 'utf8');

const oldMinProdUpdate = `            updateItemQuery += \` WHERE IdOrdemServicoItem = ?\`;`;
const newMinProdUpdate = `            // Atualizar MinProd acumulado do recurso
            let minProdCol = \`\${sName.charAt(0).toUpperCase() + sName.slice(1)}MinProd\`;
            if (sName === 'galvanizar') minProdCol = 'GALVANIZARMinProd';
            else if (sName === 'pulsionadeira') minProdCol = 'PULSIONADEIRAMinProd';
            else if (sName === 'cortealaser') minProdCol = 'CorteaLaserMinProd';

            const minProdAtualDb = parseFloat(item[minProdCol]) || 0;
            const tempoPadraoDb = parseFloat(item[\`\${sName.charAt(0).toUpperCase() + sName.slice(1)}TempoPadrao\`] || item.TempoPadrao) || 0;
            const tempoSetupDb = parseFloat(item[\`\${sName.charAt(0).toUpperCase() + sName.slice(1)}TempoSetup\`] || item.TempoSetup) || 0;

            const tempoApontamentoDb = tempoPadraoDb * currentInputQty;
            let novoMinProd = 0;
            if (minProdAtualDb === 0) {
                novoMinProd = tempoSetupDb + tempoApontamentoDb;
            } else {
                novoMinProd = minProdAtualDb + tempoApontamentoDb;
            }

            updateItemQuery += \`, \\\`\${minProdCol}\\\` = ?\`;
            updateItemParams.push(novoMinProd);

            updateItemQuery += \` WHERE IdOrdemServicoItem = ?\`;`;

if (!server.includes('novoMinProd')) {
  server = server.replace(oldMinProdUpdate, newMinProdUpdate);
  fs.writeFileSync(serverFile, server, 'utf8');
  console.log(`✅ Updated src/server.js to persist MinProd accumulated time on pointing`);
}

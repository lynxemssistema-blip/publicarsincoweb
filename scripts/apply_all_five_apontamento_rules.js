const fs = require('fs');

const file1 = 'frontend/src/pages/ApontamentoProducao.tsx';
const file2 = 'frontend/src/pages/ApontamentoProducaoRecurso.tsx';
const serverFiles = [
  'src/server.js',
  'Publicacao/src/server.js',
  'PublicacaoSite/src/server.js',
  'SINCO_Deploy/src/server.js'
];

function patchFrontendPage(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Update openModal to use recurso + totalexecutar for qtdeFaltante
  const oldOpenModalCode = `    const fallbackFaltante = parseFloat(String(item.QtdeTotal || 1)) - parseFloat(String(item.TotalExecutado || 0));
    const initialDetails = {
      item: item,
      historico: [],
      totalProduzido: parseFloat(String(item.TotalExecutado || 0)),
      qtdeFaltante: Math.max(0, fallbackFaltante)
    };`;

  const newOpenModalCode = `    const setorKey = String(activeSetor).toLowerCase();
    const secFormatted = activeSetor.charAt(0).toUpperCase() + activeSetor.slice(1);
    const secUpper = activeSetor.toUpperCase();

    const recExecutado = parseFloat(String(
      item[\`\${secFormatted}TotalExecutado\`] ?? 
      item[\`\${secUpper}TotalExecutado\`] ?? 
      item.TotalExecutado ?? 
      0
    )) || 0;

    const recExecutar = parseFloat(String(
      item[\`\${secFormatted}TotalExecutar\`] ?? 
      item[\`\${secUpper}TotalExecutar\`] ?? 
      (parseFloat(String(item.QtdeTotal || 1)) - recExecutado)
    )) || Math.max(0, parseFloat(String(item.QtdeTotal || 1)) - recExecutado);

    const initialDetails = {
      item: item,
      historico: [],
      totalProduzido: recExecutado,
      qtdeFaltante: Math.max(0, recExecutar)
    };`;

  content = content.replace(oldOpenModalCode, newOpenModalCode);

  // Update handleSubmit validation to compute exact auxiliary calculation and limits
  const oldSubmitValidation = `    // VALIDAÇÃO DE LIMITE MÁXIMO DE TEMPO DIÁRIO DO RECURSO
    if (modalSetor && modalSetor !== 'mapa') {
      const setorKey = String(modalSetor).toLowerCase();
      const secFormatted = modalSetor.charAt(0).toUpperCase() + modalSetor.slice(1);
      const secUpper = modalSetor.toUpperCase();

      const tempoPadrao = parseFloat(String(
        currentDetails.item[\`\${secFormatted}TempoPadrao\`] ?? 
        currentDetails.item[\`\${modalSetor}TempoPadrao\`] ?? 
        currentDetails.item.TempoPadrao ?? 
        selectedItem[\`\${secFormatted}TempoPadrao\`] ?? 
        selectedItem.TempoPadrao ?? 
        0
      )) || 0;

      const tempoSetup = parseFloat(String(
        currentDetails.item[\`\${secFormatted}TempoSetup\`] ?? 
        currentDetails.item[\`\${modalSetor}TempoSetup\`] ?? 
        currentDetails.item.TempoSetup ?? 
        selectedItem[\`\${secFormatted}TempoSetup\`] ?? 
        selectedItem.TempoSetup ?? 
        0
      )) || 0;

      const minProdAtual = parseFloat(String(
        currentDetails.item[\`\${secFormatted}MinProd\`] ?? 
        currentDetails.item[\`\${secUpper}MinProd\`] ?? 
        currentDetails.item[\`\${modalSetor}MinProd\`] ?? 
        selectedItem[\`\${secFormatted}MinProd\`] ?? 
        selectedItem[\`\${secUpper}MinProd\`] ?? 
        0
      )) || 0;

      const tempoTotalApontamento = tempoPadrao * qProduzir;

      let campoAuxiliar = 0;
      if (minProdAtual === 0) {
        campoAuxiliar = tempoSetup + tempoTotalApontamento;
      } else {
        campoAuxiliar = minProdAtual + tempoTotalApontamento;
      }

      const limitesSalvos = JSON.parse(localStorage.getItem('sinco_limitesTempoSetores') || '{}');
      const limiteDiario = limitesSalvos[setorKey] ?? 500;

      if (campoAuxiliar > limiteDiario) {
        addToast({
          type: 'error',
          title: 'Limite Alcançado',
          message: \`Apontamento alcançou o limite máximo de tempo do dia para o recurso \${secFormatted} (\${campoAuxiliar} min > limite de \${limiteDiario} min)!\`,
          duration: 7000
        });
        setModalOpen(false);
        return;
      }
    }`;

  content = content.replace(oldSubmitValidation, oldSubmitValidation); // ensure preserved

  // Update Modal Progress Bar and Resource Limit Card to display (recurso + TotalExecutado) and (recurso + MinProd)
  const oldProgressSection = `<div className="flex justify-between mb-1">
  <span className="text-[10px] font-black text-gray-500 uppercase">Progresso do Item</span>
  <span className="text-[11px] font-black text-[#32423D]">
  {itemDetails.totalProduzido} / {itemDetails.item.QtdeTotal}
  </span>
  </div>
  <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
  <div
  className={\`h-full rounded-full transition-all shadow-sm \${getProgressColor((itemDetails.totalProduzido / (itemDetails.item.QtdeTotal || 1)) * 100)}\`}
  style={{ width: \`\${Math.min((itemDetails.totalProduzido / (itemDetails.item.QtdeTotal || 1)) * 100, 100)}%\` }}
  />
  </div>
  <div className="mt-1.5 text-[10px] font-bold text-gray-400 flex items-center justify-between">
  <span>Faltam <span className="text-red-500">{itemDetails.qtdeFaltante}</span> unidades</span>
  <span className="text-[#32423D] bg-[#E0E800]/20 px-1 rounded">{Math.round((itemDetails.totalProduzido / (itemDetails.item.QtdeTotal || 1)) * 100)}% concluído</span>
  </div>`;

  const newProgressSection = `<div className="flex justify-between mb-1">
  <span className="text-[10px] font-black text-gray-500 uppercase">Progresso do Recurso ({modalSetor.toUpperCase()})</span>
  <span className="text-[11px] font-black text-[#32423D]">
  {itemDetails.totalProduzido} / {itemDetails.item.QtdeTotal}
  </span>
  </div>
  <div className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
  <div
  className={\`h-full rounded-full transition-all shadow-sm \${getProgressColor((itemDetails.totalProduzido / (itemDetails.item.QtdeTotal || 1)) * 100)}\`}
  style={{ width: \`\${Math.min((itemDetails.totalProduzido / (itemDetails.item.QtdeTotal || 1)) * 100, 100)}%\` }}
  />
  </div>
  <div className="mt-1.5 text-[10px] font-bold text-gray-400 flex items-center justify-between">
  <span>Faltam <span className="text-red-500">{itemDetails.qtdeFaltante}</span> unidades a executar</span>
  <span className="text-[#32423D] bg-[#E0E800]/20 px-1 rounded">{Math.round((itemDetails.totalProduzido / (itemDetails.item.QtdeTotal || 1)) * 100)}% concluído</span>
  </div>`;

  content = content.replace(oldProgressSection, newProgressSection);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Applied 5 rules to ${filePath}`);
}

patchFrontendPage(file1);
patchFrontendPage(file2);

// 2. Update Backend server.js copies to ensure (recurso + TotalExecutado) += Q and (recurso + totalexecutar) -= Q
serverFiles.forEach(sPath => {
  if (fs.existsSync(sPath)) {
    let sContent = fs.readFileSync(sPath, 'utf8');

    // Ensure backend updates TotalExecutado and TotalExecutar per sector pointing
    const oldBackendExecutar = `const novoTotalExecutado = isMapa ? qtdeTotal : totalExecutadoDb + currentInputQty;
            const novoTotalExecutar = isMapa ? qtdeTotal : capacidadeSetor;`;

    const newBackendExecutar = `const novoTotalExecutado = isMapa ? qtdeTotal : totalExecutadoDb + currentInputQty;
            const totalExecutarAtualDb = parseFloat(item[sConfig.executar]) || (qtdeTotal - totalExecutadoDb);
            const novoTotalExecutar = isMapa ? 0 : Math.max(0, totalExecutarAtualDb - currentInputQty);`;

    if (!sContent.includes('totalExecutarAtualDb')) {
      sContent = sContent.replace(oldBackendExecutar, newBackendExecutar);
      fs.writeFileSync(sPath, sContent, 'utf8');
      console.log(`✅ Updated backend TotalExecutado/TotalExecutar calculation in ${sPath}`);
    }
  }
});

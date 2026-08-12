const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/server.js');
let content = fs.readFileSync(file, 'utf8');

// 1. Fix UsuarioPlanejadoInicio in salvar-setores-planejamento (if not there)
const target1 = `const values = [inicio, final, diasProducao, IdOrdemServicoItem, processofabricacao];`;
const replace1 = `const usuarioLogado = req.tenantUser?.nome || req.tenantUser?.login || req.user?.nome || req.user?.login || 'Sistema';
            const query = \`UPDATE material_processo SET PlanejadoInicio = ?, UsuarioPlanejadoInicio = ?, PlanejadoFinal = ?, UsuarioPlanejadoFinal = ?, DiasProducao = ? WHERE IdMaterialProcesso = ?\`;
            const values = [inicio, usuarioLogado, final, usuarioLogado, diasProducao, mp.IdMaterialProcesso];`;

if (content.indexOf('UPDATE material_processo SET PlanejadoInicio = ?, UsuarioPlanejadoInicio = ?') === -1) {
    // Wait, let's just replace the exact query string
    content = content.replace(
        /UPDATE material_processo SET PlanejadoInicio = \?, PlanejadoFinal = \?, DiasProducao = \? WHERE IdMaterialProcesso = \?/g,
        'UPDATE material_processo SET PlanejadoInicio = ?, UsuarioPlanejadoInicio = ?, PlanejadoFinal = ?, UsuarioPlanejadoFinal = ?, DiasProducao = ? WHERE IdMaterialProcesso = ?'
    );
    content = content.replace(
        /const values = \[inicio, final, diasProducao, mp\.IdMaterialProcesso\];/g,
        "const usuarioLogado = req.tenantUser?.nome || req.tenantUser?.login || req.user?.nome || req.user?.login || 'Sistema';\n            const values = [inicio, usuarioLogado, final, usuarioLogado, diasProducao, mp.IdMaterialProcesso];"
    );
}

// 2. Fix Apontamento saving material_processo tracking and using novoTotalExecutar for finalizado
// We will replace the block from `const novoTotalExecutado = isMapa ? qtdeTotal : totalExecutadoDb + currentInputQty;`
const target2 = `const novoTotalExecutado = isMapa ? qtdeTotal : totalExecutadoDb + currentInputQty;
            const totalExecutarAtualDb = parseFloat(item[sConfig.executar]) || (qtdeTotal - totalExecutadoDb);
            const novoTotalExecutar = isMapa ? 0 : Math.max(0, totalExecutarAtualDb - currentInputQty); // NUNCA MOVIDO! Apenas preservado.
            const novoPercentual = isMapa ? 100 : (qtdeTotal > 0 ? Math.min(100, Math.round((novoTotalExecutado / qtdeTotal) * 100)) : 0);
            const finalizado = novoTotalExecutado >= qtdeTotal;`;

const replace2 = `const novoTotalExecutado = isMapa ? qtdeTotal : totalExecutadoDb + currentInputQty;
            const totalExecutarAtualDb = parseFloat(item[sConfig.executar]) || (qtdeTotal - totalExecutadoDb);
            const novoTotalExecutar = isMapa ? 0 : Math.max(0, totalExecutarAtualDb - currentInputQty); // NUNCA MOVIDO! Apenas preservado.
            const novoPercentual = isMapa ? 100 : (qtdeTotal > 0 ? Math.min(100, Math.round((novoTotalExecutado / qtdeTotal) * 100)) : 0);
            const finalizado = novoTotalExecutar <= 0;`;
content = content.replace(target2, replace2);

// Now replace the RealizadoFinal tracking logic
const target3 = `            // 5a. Realizado INICIO: gravar no item se for o primeiro apontamento do setor (campo NULL)
            const dateForThisSetor = getDateForSetor(sName);
            if (!item[sConfig.inicio]) {
                updateItemQuery += \`, \${sConfig.inicio} = ?, \${sConfig.userInicio} = ?\`;
                updateItemParams.push(dateForThisSetor, CriadoPor || 'Sistema');
            }

            // 5b. Realizado FINAL: gravar no item quando todas as peças do setor forem produzidas
            if (finalizado || isMapa) {
                updateItemQuery += \`, \${sConfig.final} = ?, \${sConfig.userFinal} = ?\`;
                updateItemParams.push(dateForThisSetor, CriadoPor || 'Sistema');
                if (sName === 'montagem') {
                    updateItemQuery += \`, DataFinalMontagem = ?\`;
                    updateItemParams.push(dateForThisSetor);
                }
            }`;

const replace3 = `            const usuarioRealizado = req.tenantUser?.nome || req.tenantUser?.login || req.user?.nome || req.user?.login || CriadoPor || 'Sistema';

            // 5a. Realizado INICIO: gravar no item se for o primeiro apontamento do setor (campo NULL)
            const dateForThisSetor = getDateForSetor(sName);
            let materialProcessoUpdates = [];
            let materialProcessoParams = [];

            if (!item[sConfig.inicio]) {
                updateItemQuery += \`, \${sConfig.inicio} = ?, \${sConfig.userInicio} = ?\`;
                updateItemParams.push(dateForThisSetor, usuarioRealizado);

                materialProcessoUpdates.push('RealizadoInicio = ?');
                materialProcessoParams.push(dateForThisSetor);
                materialProcessoUpdates.push('UsuarioRealizadoInicio = ?');
                materialProcessoParams.push(usuarioRealizado);
            }

            // 5b. Realizado FINAL: gravar no item quando todas as peças do setor forem produzidas
            if (finalizado || isMapa) {
                updateItemQuery += \`, \${sConfig.final} = ?, \${sConfig.userFinal} = ?\`;
                updateItemParams.push(dateForThisSetor, usuarioRealizado);
                if (sName === 'montagem') {
                    updateItemQuery += \`, DataFinalMontagem = ?\`;
                    updateItemParams.push(dateForThisSetor);
                }

                materialProcessoUpdates.push('RealizadoFinal = ?');
                materialProcessoParams.push(dateForThisSetor);
                materialProcessoUpdates.push('UsuarioRealizadoFinal = ?');
                materialProcessoParams.push(usuarioRealizado);
            }

            if (materialProcessoUpdates.length > 0 && item.CodMatFabricante) {
                const updateMpQuery = \`
                    UPDATE material_processo 
                    SET \${materialProcessoUpdates.join(', ')}
                    WHERE IdOrdemServico = ? 
                      AND codmatFabricante = ?
                      AND IdProcesso IN (SELECT IdProcessoFabricacao FROM processofabricacao WHERE LOWER(processofabricacao) = ?)
                \`;
                materialProcessoParams.push(item.IdOrdemServico, item.CodMatFabricante, sName.toLowerCase());
                await conn.execute(updateMpQuery, materialProcessoParams).catch(e => console.error('[Save material_processo Apontamento] Error:', e.message));
            }`;

if (content.indexOf('materialProcessoUpdates = []') === -1) {
    content = content.replace(target3, replace3);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Restoration completed!');

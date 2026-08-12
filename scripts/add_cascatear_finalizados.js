const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '../src/server.js');
let content = fs.readFileSync(serverFile, 'utf8');

const cascatearCode = `
// NOVO HELPER: Cascata de Finalização (Item -> OS -> Tag -> Projeto)
async function cascatearFinalizados(connection, idOrdemServicoItem, idOrdemServico, idTag, idProjeto, codMatFabricante) {
    if (!idOrdemServicoItem || !codMatFabricante) return;

    try {
        // 1. Nível ITEM: Todos os recursos (material_processo) concluídos?
        const [mpRows] = await connection.execute(\`
            SELECT COUNT(*) as pendentes 
            FROM material_processo 
            WHERE IdOrdemServico = ? AND codmatFabricante = ? AND COALESCE(TotalExecutar, 0) > 0
        \`, [idOrdemServico, codMatFabricante]);

        const itemFinalizado = (mpRows[0].pendentes === 0) ? 'C' : '';
        await connection.execute(\`
            UPDATE ordemservicoitem 
            SET OrdemServicoItemFinalizado = ? 
            WHERE IdOrdemServicoItem = ?
        \`, [itemFinalizado, idOrdemServicoItem]);

        // 2. Nível OS: Todos os itens concluídos?
        if (idOrdemServico) {
            const [itemRows] = await connection.execute(\`
                SELECT COUNT(*) as pendentes 
                FROM ordemservicoitem 
                WHERE IdOrdemServico = ? AND (d_e_l_e_t_e IS NULL OR d_e_l_e_t_e != '*') 
                  AND (OrdemServicoItemFinalizado IS NULL OR OrdemServicoItemFinalizado != 'C')
            \`, [idOrdemServico]);

            const osFinalizada = (itemRows[0].pendentes === 0) ? 'C' : '';
            await connection.execute(\`
                UPDATE ordemservico 
                SET OrdemServicoFinalizado = ? 
                WHERE IdOrdemServico = ?
            \`, [osFinalizada, idOrdemServico]);
            
            // Se a OS não foi finalizada, Tag e Projeto tb não serão. 
            // Mas vamos processar a cascata de qualquer forma para atualizar regressivamente se houver estorno.
        }

        // 3. Nível TAG: Todas as OS concluídas?
        if (idTag) {
            const [osRows] = await connection.execute(\`
                SELECT COUNT(*) as pendentes 
                FROM ordemservico 
                WHERE IdTag = ? AND (d_e_l_e_t_e IS NULL OR d_e_l_e_t_e != '*') 
                  AND (OrdemServicoFinalizado IS NULL OR OrdemServicoFinalizado != 'C')
            \`, [idTag]);

            const tagFinalizada = (osRows[0].pendentes === 0) ? 'C' : '';
            await connection.execute(\`
                UPDATE tags 
                SET Finalizado = ? 
                WHERE IdTag = ?
            \`, [tagFinalizada, idTag]);
        }

        // 4. Nível PROJETO: Todas as Tags concluídas?
        if (idProjeto) {
            const [tagRows] = await connection.execute(\`
                SELECT COUNT(*) as pendentes 
                FROM tags 
                WHERE IdProjeto = ? AND (d_e_l_e_t_e IS NULL OR d_e_l_e_t_e != '*') 
                  AND (Finalizado IS NULL OR Finalizado != 'C')
            \`, [idProjeto]);

            const projetoFinalizado = (tagRows[0].pendentes === 0) ? 'C' : '';
            await connection.execute(\`
                UPDATE projetos 
                SET Finalizado = ? 
                WHERE IdProjeto = ?
            \`, [projetoFinalizado, idProjeto]);
        }
    } catch (e) {
        console.error('[cascatearFinalizados] Erro:', e.message);
    }
}
`;

// Insert the new helper before `cascatearSaldoProximoRecurso`
const targetStr = 'async function cascatearSaldoProximoRecurso';
if (content.indexOf('cascatearFinalizados') === -1) {
    content = content.replace(targetStr, cascatearCode + '\n' + targetStr);
}

// Call it in `/api/apontamento`
const targetCall = 'await recalcularQuantidadesTotais(item.IdOrdemServico, conn);';
const callCode = `
            // Cascata de Finalização C (Item -> OS -> Tag -> Projeto)
            await cascatearFinalizados(conn, item.IdOrdemServicoItem, item.IdOrdemServico, item.IdTag, item.IdProjeto, item.CodMatFabricante);
`;

if (content.indexOf('cascatearFinalizados(conn, item.IdOrdemServicoItem') === -1) {
    content = content.replace(targetCall, targetCall + '\n' + callCode);
}

fs.writeFileSync(serverFile, content, 'utf8');
console.log('Script add_cascatear_finalizados.js concluído.');

const db = require('../src/config/db');

async function run() {
    console.log('--- Iniciando correção da tabela material_processo baseada em ordemservicoitemcontrole ---');
    try {
        const conn = await db.executeOnDefault('SELECT 1'); // just to init connection

        // Fetch all material_processo records
        const [mpRows] = await db.executeOnDefault(`
            SELECT mp.IdMaterialProcesso, mp.IdOrdemServico, mp.codmatFabricante, pf.processofabricacao 
            FROM material_processo mp
            INNER JOIN processofabricacao pf ON mp.IdProcesso = pf.IdProcessoFabricacao
        `);
        console.log(`Encontrados ${mpRows.length} registros em material_processo para processar.`);

        let atualizados = 0;

        for (const mp of mpRows) {
            // Find the item for this mp
            const [itemRows] = await db.executeOnDefault(`
                SELECT IdOrdemServicoItem, QtdeTotal 
                FROM ordemservicoitem 
                WHERE IdOrdemServico = ? AND CodMatFabricante = ? AND (d_e_l_e_t_e IS NULL OR d_e_l_e_t_e != '*')
                LIMIT 1
            `, [mp.IdOrdemServico, mp.codmatFabricante]);

            if (itemRows.length === 0) continue;
            const item = itemRows[0];
            const IdOrdemServicoItem = item.IdOrdemServicoItem;
            const qtdeTotal = parseFloat(item.QtdeTotal) || 0;

            // Find pointings
            const [apontamentos] = await db.executeOnDefault(`
                SELECT DataCriacao, CriadoPor, QtdeProduzida 
                FROM ordemservicoitemcontrole 
                WHERE IdOrdemServicoItem = ? AND LOWER(Processo) = ? AND (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E != '*')
                ORDER BY DataCriacao ASC
            `, [IdOrdemServicoItem, mp.processofabricacao.toLowerCase()]);

            if (apontamentos.length === 0) continue;

            const primeiro = apontamentos[0];
            
            let totalApontado = 0;
            let ultimo = null;

            for (const ap of apontamentos) {
                totalApontado += parseFloat(ap.QtdeProduzida) || 0;
                ultimo = ap; // Since it's ordered by DataCriacao ASC, the last one in loop is the latest
            }

            let updates = [];
            let params = [];

            updates.push('RealizadoInicio = ?', 'UsuarioRealizadoInicio = ?');
            params.push(primeiro.DataCriacao, primeiro.CriadoPor);

            if (totalApontado >= qtdeTotal) {
                updates.push('RealizadoFinal = ?', 'UsuarioRealizadoFinal = ?');
                params.push(ultimo.DataCriacao, ultimo.CriadoPor);
            }

            params.push(mp.IdMaterialProcesso);

            await db.executeOnDefault(`
                UPDATE material_processo 
                SET ${updates.join(', ')}
                WHERE IdMaterialProcesso = ?
            `, params);

            atualizados++;
        }

        console.log(`Correção concluída. ${atualizados} registros atualizados com sucesso.`);
    } catch (e) {
        console.error('Erro na correção:', e);
    } finally {
        process.exit(0);
    }
}

run();

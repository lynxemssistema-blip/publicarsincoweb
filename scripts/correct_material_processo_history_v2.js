const db = require('../src/config/db');

async function run() {
    console.log('--- Corrigindo tabela material_processo novamente ---');
    try {
        const conn = await db.executeOnDefault('SELECT 1');

        const [mpRows] = await db.executeOnDefault(`
            SELECT mp.IdMaterialProcesso, mp.IdOrdemServico, mp.codmatFabricante, pf.processofabricacao, mp.TotalExecutar
            FROM material_processo mp
            INNER JOIN processofabricacao pf ON mp.IdProcesso = pf.IdProcessoFabricacao
        `);

        let atualizados = 0;

        for (const mp of mpRows) {
            const [itemRows] = await db.executeOnDefault(`
                SELECT IdOrdemServicoItem 
                FROM ordemservicoitem 
                WHERE IdOrdemServico = ? AND CodMatFabricante = ? AND (d_e_l_e_t_e IS NULL OR d_e_l_e_t_e != '*')
                LIMIT 1
            `, [mp.IdOrdemServico, mp.codmatFabricante]);

            if (itemRows.length === 0) continue;
            const IdOrdemServicoItem = itemRows[0].IdOrdemServicoItem;

            const [apontamentos] = await db.executeOnDefault(`
                SELECT DataCriacao, CriadoPor, QtdeProduzida, QtdeTotal 
                FROM ordemservicoitemcontrole 
                WHERE IdOrdemServicoItem = ? AND LOWER(Processo) = ? AND (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E != '*')
                ORDER BY DataCriacao ASC
            `, [IdOrdemServicoItem, mp.processofabricacao.toLowerCase()]);

            if (apontamentos.length === 0) {
                // If there are no pointings, make sure Realizado is null
                await db.executeOnDefault(`
                    UPDATE material_processo 
                    SET RealizadoInicio = NULL, UsuarioRealizadoInicio = NULL, RealizadoFinal = NULL, UsuarioRealizadoFinal = NULL
                    WHERE IdMaterialProcesso = ?
                `, [mp.IdMaterialProcesso]);
                continue;
            }

            const primeiro = apontamentos[0];
            const targetTotal = parseFloat(primeiro.QtdeTotal) || 0;
            
            let totalApontado = 0;
            let ultimo = null;

            for (const ap of apontamentos) {
                totalApontado += parseFloat(ap.QtdeProduzida) || 0;
                ultimo = ap;
            }

            // We can also rely on mp.TotalExecutar <= 0 if it's more accurate for current state
            const isFinished = (parseFloat(mp.TotalExecutar) <= 0);

            let updates = [];
            let params = [];

            updates.push('RealizadoInicio = ?', 'UsuarioRealizadoInicio = ?');
            params.push(primeiro.DataCriacao, primeiro.CriadoPor);

            if (isFinished) {
                updates.push('RealizadoFinal = ?', 'UsuarioRealizadoFinal = ?');
                params.push(ultimo.DataCriacao, ultimo.CriadoPor);
            } else {
                updates.push('RealizadoFinal = NULL', 'UsuarioRealizadoFinal = NULL');
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

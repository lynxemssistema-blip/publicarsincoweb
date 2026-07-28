const db = require('../src/config/db.js');

async function atualizarMinProdCascata(conn, idItem, processoKey, inputQty, operacao = 'ADD') {
    try {
        if (!idItem || !processoKey || !inputQty || inputQty <= 0) return;

        let rawName = String(processoKey).trim();
        let recName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        if (rawName.toLowerCase() === 'montagem') recName = 'Montagem';
        else if (rawName.toLowerCase() === 'corte') recName = 'Corte';
        else if (rawName.toLowerCase() === 'dobra') recName = 'Dobra';
        else if (rawName.toLowerCase() === 'solda') recName = 'Solda';
        else if (rawName.toLowerCase() === 'pintura') recName = 'Pintura';
        else if (rawName.toLowerCase() === 'galvanizar') recName = 'GALVANIZAR';
        else if (rawName.toLowerCase() === 'pulsionadeira') recName = 'PULSIONADEIRA';
        else if (rawName.toLowerCase() === 'cortealaser') recName = 'CorteaLaser';

        const minProdCol = `${recName}MinProd`;
        const txtCol1 = `txt${recName}`;
        const txtCol2 = `txt${rawName}`;

        const [itemRows] = await conn.execute(
            `SELECT osi.*, os.IdOrdemServico, os.IdTag, os.Tag, os.IdProjeto, os.Projeto
             FROM ordemservicoitem osi
             INNER JOIN ordemservico os ON osi.IdOrdemServico = os.IdOrdemServico
             WHERE osi.IdOrdemServicoItem = ?`,
            [idItem]
        );
        if (!itemRows || itemRows.length === 0) {
            console.log(`Item ${idItem} nao encontrado.`);
            return;
        }
        const item = itemRows[0];

        const tempoPadrao = parseFloat(item[txtCol1] || item[txtCol2] || item[`txt${recName.toUpperCase()}`]) || 0;
        const totalprod = Math.round(tempoPadrao * inputQty);

        console.log(`Calculado totalprod = ${totalprod} (tempoPadrao=${tempoPadrao} * inputQty=${inputQty}) para recurso ${recName}`);

        if (totalprod <= 0) {
            console.log(`totalprod e <= 0. Nada a atualizar.`);
            return;
        }

        const valModifier = operacao === 'SUB' ? `- ${totalprod}` : `+ ${totalprod}`;

        const queryItem = `UPDATE ordemservicoitem SET \`${minProdCol}\` = GREATEST(0, COALESCE(\`${minProdCol}\`, 0) ${valModifier}) WHERE IdOrdemServicoItem = ?`;
        const queryOS   = `UPDATE ordemservico SET \`${minProdCol}\` = GREATEST(0, COALESCE(\`${minProdCol}\`, 0) ${valModifier}) WHERE IdOrdemServico = ?`;

        await conn.execute(queryItem, [idItem]);
        console.log(`[Item] ${minProdCol} atualizado no item ${idItem}`);

        if (item.IdOrdemServico) {
            await conn.execute(queryOS, [item.IdOrdemServico]);
            console.log(`[OS] ${minProdCol} atualizado na OS ${item.IdOrdemServico}`);
        }

        if (item.IdTag) {
            await conn.execute(`UPDATE tags SET \`${minProdCol}\` = GREATEST(0, COALESCE(\`${minProdCol}\`, 0) ${valModifier}) WHERE IdTag = ?`, [item.IdTag]);
            console.log(`[Tag] ${minProdCol} atualizado na Tag ID ${item.IdTag}`);
        } else if (item.Tag) {
            await conn.execute(`UPDATE tags SET \`${minProdCol}\` = GREATEST(0, COALESCE(\`${minProdCol}\`, 0) ${valModifier}) WHERE Tag = ?`, [item.Tag]);
            console.log(`[Tag] ${minProdCol} atualizado na Tag ${item.Tag}`);
        }

        if (item.IdProjeto) {
            await conn.execute(`UPDATE projetos SET \`${minProdCol}\` = GREATEST(0, COALESCE(\`${minProdCol}\`, 0) ${valModifier}) WHERE IdProjeto = ?`, [item.IdProjeto]);
            console.log(`[Projeto] ${minProdCol} atualizado no Projeto ID ${item.IdProjeto}`);
        } else if (item.Projeto) {
            await conn.execute(`UPDATE projetos SET \`${minProdCol}\` = GREATEST(0, COALESCE(\`${minProdCol}\`, 0) ${valModifier}) WHERE Projeto = ?`, [item.Projeto]);
            console.log(`[Projeto] ${minProdCol} atualizado no Projeto ${item.Projeto}`);
        }

        console.log(`✅ Cascata concluida com sucesso!`);
    } catch (e) {
        console.error(`Erro no teste:`, e);
    }
}

async function runTest() {
    try {
        // Buscar um item com txtCorte > 0 ou simular setando um txtCorte = 15 para testar
        const [items] = await db.executeOnDefault("SELECT IdOrdemServicoItem, txtCorte FROM ordemservicoitem WHERE txtCorte IS NOT NULL AND txtCorte != '' AND txtCorte != '0' LIMIT 1");
        
        let itemId = null;
        if (items.length > 0) {
            itemId = items[0].IdOrdemServicoItem;
            console.log(`Encontrado item com txtCorte: ID=${itemId}, txtCorte=${items[0].txtCorte}`);
        } else {
            // Pegar qualquer item e atualizar temporariamente o txtCorte para 10 para teste
            const [anyItem] = await db.executeOnDefault("SELECT IdOrdemServicoItem FROM ordemservicoitem LIMIT 1");
            if (anyItem.length > 0) {
                itemId = anyItem[0].IdOrdemServicoItem;
                await db.executeOnDefault("UPDATE ordemservicoitem SET txtCorte = '10' WHERE IdOrdemServicoItem = ?", [itemId]);
                console.log(`Definido txtCorte = '10' temporariamente no item ID=${itemId}`);
            }
        }

        if (itemId) {
            console.log('\n--- Executando teste ADD de 2 unidades ---');
            await atualizarMinProdCascata({ execute: (q, p) => db.executeOnDefault(q, p) }, itemId, 'Corte', 2, 'ADD');

            // Verificar valores atualizados
            const [checkItem] = await db.executeOnDefault("SELECT IdOrdemServicoItem, IdOrdemServico, CorteMinProd FROM ordemservicoitem WHERE IdOrdemServicoItem = ?", [itemId]);
            console.log('\nResultado Item:', checkItem[0]);

            const [checkOS] = await db.executeOnDefault("SELECT IdOrdemServico, CorteMinProd FROM ordemservico WHERE IdOrdemServico = ?", [checkItem[0].IdOrdemServico]);
            console.log('Resultado OS:', checkOS[0]);

            console.log('\n--- Executando teste SUB (estorno) de 2 unidades ---');
            await atualizarMinProdCascata({ execute: (q, p) => db.executeOnDefault(q, p) }, itemId, 'Corte', 2, 'SUB');
        }
    } catch (err) {
        console.error('Erro geral:', err);
    } finally {
        process.exit(0);
    }
}

runTest();

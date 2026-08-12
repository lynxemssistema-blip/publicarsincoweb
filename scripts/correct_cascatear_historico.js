const db = require('../src/config/db');

async function run() {
    console.log('--- Iniciando correção da CASCATA de conclusão baseada em material_processo ---');
    try {
        const conn = await db.executeOnDefault('SELECT 1');

        // Pega todos os itens ativos com recursos
        const [itens] = await db.executeOnDefault(`
            SELECT DISTINCT oi.IdOrdemServicoItem, oi.IdOrdemServico, oi.IdTag, oi.IdProjeto, oi.CodMatFabricante
            FROM ordemservicoitem oi
            INNER JOIN material_processo mp ON mp.IdOrdemServico = oi.IdOrdemServico AND mp.codmatFabricante = oi.CodMatFabricante
            WHERE (oi.d_e_l_e_t_e IS NULL OR oi.d_e_l_e_t_e != '*')
        `);

        console.log(`Verificando ${itens.length} itens para cascata de conclusão...`);

        for (const item of itens) {
            // Nível ITEM
            const [mpRows] = await db.executeOnDefault(`
                SELECT COUNT(*) as pendentes 
                FROM material_processo 
                WHERE IdOrdemServico = ? AND codmatFabricante = ? AND COALESCE(TotalExecutar, 0) > 0
            `, [item.IdOrdemServico, item.CodMatFabricante]);

            const itemFinalizado = (mpRows[0].pendentes === 0) ? 'C' : '';
            await db.executeOnDefault(`UPDATE ordemservicoitem SET OrdemServicoItemFinalizado = ? WHERE IdOrdemServicoItem = ?`, [itemFinalizado, item.IdOrdemServicoItem]);
        }

        // Nível OS
        const [osAtivas] = await db.executeOnDefault(`SELECT IdOrdemServico FROM ordemservico WHERE (d_e_l_e_t_e IS NULL OR d_e_l_e_t_e != '*')`);
        for (const os of osAtivas) {
            const [itemRows] = await db.executeOnDefault(`
                SELECT COUNT(*) as pendentes 
                FROM ordemservicoitem 
                WHERE IdOrdemServico = ? AND (d_e_l_e_t_e IS NULL OR d_e_l_e_t_e != '*') 
                  AND (OrdemServicoItemFinalizado IS NULL OR OrdemServicoItemFinalizado != 'C')
            `, [os.IdOrdemServico]);

            const osFinalizada = (itemRows[0].pendentes === 0) ? 'C' : '';
            await db.executeOnDefault(`UPDATE ordemservico SET OrdemServicoFinalizado = ? WHERE IdOrdemServico = ?`, [osFinalizada, os.IdOrdemServico]);
        }

        // Nível TAG
        const [tagsAtivas] = await db.executeOnDefault(`SELECT IdTag FROM tags WHERE (d_e_l_e_t_e IS NULL OR d_e_l_e_t_e != '*')`);
        for (const tag of tagsAtivas) {
            const [osRows] = await db.executeOnDefault(`
                SELECT COUNT(*) as pendentes 
                FROM ordemservico 
                WHERE IdTag = ? AND (d_e_l_e_t_e IS NULL OR d_e_l_e_t_e != '*') 
                  AND (OrdemServicoFinalizado IS NULL OR OrdemServicoFinalizado != 'C')
            `, [tag.IdTag]);

            const tagFinalizada = (osRows[0].pendentes === 0) ? 'C' : '';
            await db.executeOnDefault(`UPDATE tags SET Finalizado = ? WHERE IdTag = ?`, [tagFinalizada, tag.IdTag]);
        }

        // Nível PROJETO
        const [projetosAtivos] = await db.executeOnDefault(`SELECT IdProjeto FROM projetos WHERE (d_e_l_e_t_e IS NULL OR d_e_l_e_t_e != '*')`);
        for (const proj of projetosAtivos) {
            const [tagRows] = await db.executeOnDefault(`
                SELECT COUNT(*) as pendentes 
                FROM tags 
                WHERE IdProjeto = ? AND (d_e_l_e_t_e IS NULL OR d_e_l_e_t_e != '*') 
                  AND (Finalizado IS NULL OR Finalizado != 'C')
            `, [proj.IdProjeto]);

            const projetoFinalizado = (tagRows[0].pendentes === 0) ? 'C' : '';
            await db.executeOnDefault(`UPDATE projetos SET Finalizado = ? WHERE IdProjeto = ?`, [projetoFinalizado, proj.IdProjeto]);
        }

        console.log('Cascata histórica de conclusão finalizada com sucesso!');
    } catch (e) {
        console.error('Erro:', e);
    } finally {
        process.exit(0);
    }
}

run();

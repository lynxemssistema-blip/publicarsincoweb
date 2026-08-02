const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixCascata() {
    const dbPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'lynxlocal',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    console.log("Iniciando correção de cascata...");

    try {
        const sectors = ['Corte', 'Dobra', 'Solda', 'Pintura', 'Montagem', 'CorteaLaser', 'Pulsionadeira', 'Galvanizar', 'Engenharia'];
        
        let tagsSet = '';
        let projSet = '';
        
        for (const sec of sectors) {
            tagsSet += `
                ${sec}TempoSetup = (SELECT COALESCE(SUM(os.${sec}TempoSetup), 0) FROM ordemservico os WHERE os.IdTag = tags.IdTag AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')),
                ${sec}TotalSetup = (SELECT COALESCE(SUM(os.${sec}TotalSetup), 0) FROM ordemservico os WHERE os.IdTag = tags.IdTag AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')),
                ${sec}TempoPadrao = (SELECT COALESCE(SUM(os.${sec}TempoPadrao), 0) FROM ordemservico os WHERE os.IdTag = tags.IdTag AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')),
                ${sec}TotalPadrao = (SELECT COALESCE(SUM(os.${sec}TotalPadrao), 0) FROM ordemservico os WHERE os.IdTag = tags.IdTag AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')),
                ${sec}TotalTempo = (SELECT COALESCE(SUM(os.${sec}TotalTempo), 0) FROM ordemservico os WHERE os.IdTag = tags.IdTag AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')),
                ${sec}DiasProducao = (SELECT CASE WHEN SUM(os.${sec}TotalTempo) > 0 THEN CEIL(SUM(os.${sec}TotalTempo) / 480) ELSE 0 END FROM ordemservico os WHERE os.IdTag = tags.IdTag AND (os.D_E_L_E_T_E IS NULL OR os.D_E_L_E_T_E = '' OR os.D_E_L_E_T_E = ' ')),`;
                
            projSet += `
                ${sec}TempoSetup = (SELECT COALESCE(SUM(t.${sec}TempoSetup), 0) FROM tags t WHERE t.IdProjeto = projetos.IdProjeto AND (t.D_E_L_E_T_E IS NULL OR t.D_E_L_E_T_E = '')),
                ${sec}TotalSetup = (SELECT COALESCE(SUM(t.${sec}TotalSetup), 0) FROM tags t WHERE t.IdProjeto = projetos.IdProjeto AND (t.D_E_L_E_T_E IS NULL OR t.D_E_L_E_T_E = '')),
                ${sec}TempoPadrao = (SELECT COALESCE(SUM(t.${sec}TempoPadrao), 0) FROM tags t WHERE t.IdProjeto = projetos.IdProjeto AND (t.D_E_L_E_T_E IS NULL OR t.D_E_L_E_T_E = '')),
                ${sec}TotalPadrao = (SELECT COALESCE(SUM(t.${sec}TotalPadrao), 0) FROM tags t WHERE t.IdProjeto = projetos.IdProjeto AND (t.D_E_L_E_T_E IS NULL OR t.D_E_L_E_T_E = '')),
                ${sec}TotalTempo = (SELECT COALESCE(SUM(t.${sec}TotalTempo), 0) FROM tags t WHERE t.IdProjeto = projetos.IdProjeto AND (t.D_E_L_E_T_E IS NULL OR t.D_E_L_E_T_E = '')),
                ${sec}DiasProducao = (SELECT CASE WHEN SUM(t.${sec}TotalTempo) > 0 THEN CEIL(SUM(t.${sec}TotalTempo) / 480) ELSE 0 END FROM tags t WHERE t.IdProjeto = projetos.IdProjeto AND (t.D_E_L_E_T_E IS NULL OR t.D_E_L_E_T_E = '')),`;
        }

        // Remover a última vírgula
        tagsSet = tagsSet.replace(/,$/, '');
        projSet = projSet.replace(/,$/, '');

        // Atualizar todas as tags
        console.log("Atualizando cascata em TAGS...");
        const [resTags] = await dbPool.execute(`UPDATE tags SET ${tagsSet} WHERE (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = '')`);
        console.log(`Tags atualizadas: ${resTags.affectedRows}`);

        // Atualizar todos os projetos
        console.log("Atualizando cascata em PROJETOS...");
        const [resProj] = await dbPool.execute(`UPDATE projetos SET ${projSet} WHERE (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = '')`);
        console.log(`Projetos atualizados: ${resProj.affectedRows}`);

        console.log("Cascata corrigida com sucesso em todos os registros do banco de dados!");
    } catch(e) {
        console.error("Erro durante a migração:", e);
    } finally {
        await dbPool.end();
    }
}

fixCascata();

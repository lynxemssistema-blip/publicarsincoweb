const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const c = await mysql.createConnection({
        host: process.env.CENTRAL_DB_HOST,
        user: process.env.CENTRAL_DB_USER,
        password: process.env.CENTRAL_DB_PASS,
        database: 'lynxlocal'
    });
    
    let [rows] = await c.execute(`SELECT * FROM material_processo WHERE IdOrdemServico = 1`);
    console.log("ALL material_processo for OS 1:", rows);
    
    let [rows2] = await c.execute(`
            SELECT osi.CodMatFabricante, mp.codmatFabricante AS MP_Cod
            FROM (
                SELECT mp.codmatFabricante, mp.IdOrdemServico, MAX(mp.TotalExecutar) as MaxTotalExecutar
                FROM material_processo mp
                JOIN ordemservico os ON os.IdOrdemServico = mp.IdOrdemServico 
                   AND os.IdProjeto = mp.IdProjeto 
                   AND os.IdTag = mp.IdTag
                WHERE mp.IdOrdemServico = 1 AND mp.Ativo = 'A'
                GROUP BY mp.codmatFabricante, mp.IdOrdemServico
            ) mp
            LEFT JOIN ordemservicoitem osi ON osi.CodMatFabricante = mp.codmatFabricante AND osi.IdOrdemServico = mp.IdOrdemServico AND (osi.D_E_L_E_T_E IS NULL OR osi.D_E_L_E_T_E = '')
    `);
    console.log("JOIN QUERY RESULT:", rows2);

    c.end();
}
run().catch(console.error);

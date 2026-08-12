const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const c = await mysql.createConnection({
        host: process.env.CENTRAL_DB_HOST,
        user: process.env.CENTRAL_DB_USER,
        password: process.env.CENTRAL_DB_PASS,
        database: 'lynxlocal'
    });
    
    try {
        let [rows2] = await c.execute(`
            SELECT osi.*,
                mp.codmatFabricante AS CodMatFabricante,
                mp.IdOrdemServico,
                COALESCE(osi.IdOrdemServicoItem, ABS(CAST(CONV(SUBSTRING(MD5(mp.codmatFabricante), 1, 8), 16, 10) AS SIGNED))) AS IdOrdemServicoItem,
                COALESCE(osi.DescResumo, m.DescResumo) AS DescResumo,
                COALESCE(osi.DescDetal, m.DescDetal) AS DescDetal,
                COALESCE(osi.Fator, 1) AS Fator,
                mp.MaxTotalExecutar AS QtdeTotal,
                COALESCE(osi.Peso, m.Peso) AS Peso,
                COALESCE(osi.EnderecoArquivo, m.EnderecoArquivo) AS EnderecoArquivo,
                COALESCE(osi.Liberado_Engenharia, 'N') AS Liberado_Engenharia,
                COALESCE(osi.ProdutoPrincipal, 'N') AS ProdutoPrincipal
            FROM (
                SELECT mp.codmatFabricante, mp.IdOrdemServico, MAX(mp.TotalExecutar) as MaxTotalExecutar
                FROM material_processo mp
                JOIN ordemservico os ON os.IdOrdemServico = mp.IdOrdemServico 
                   AND os.IdProjeto = mp.IdProjeto 
                   AND os.IdTag = mp.IdTag
                WHERE mp.IdOrdemServico = ? AND mp.Ativo = 'A'
                GROUP BY mp.codmatFabricante, mp.IdOrdemServico
            ) mp
            LEFT JOIN ordemservicoitem osi ON osi.CodMatFabricante = mp.codmatFabricante AND osi.IdOrdemServico = mp.IdOrdemServico AND (osi.D_E_L_E_T_E IS NULL OR osi.D_E_L_E_T_E = '')
            LEFT JOIN material m ON m.CodMatFabricante = mp.codmatFabricante
            ORDER BY IdOrdemServicoItem
        `, [1]);
        console.log("SUCCESS!", rows2);
    } catch(err) {
        console.error("SQL ERROR!", err);
    }

    c.end();
}
run().catch(console.error);

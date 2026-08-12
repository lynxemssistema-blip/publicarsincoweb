const mysql = require('mysql2/promise');

async function test() {
    const c = await mysql.createConnection({host:'localhost',user:'root',password:'sincoweb',database:'sinco_32'});
    const query = `
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
            SELECT codmatFabricante, IdOrdemServico, MAX(TotalExecutar) as MaxTotalExecutar
            FROM material_processo
            WHERE IdOrdemServico = ? AND Ativo = 'A' AND (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = '')
            GROUP BY codmatFabricante, IdOrdemServico
        ) mp
        LEFT JOIN ordemservicoitem osi ON osi.CodMatFabricante = mp.codmatFabricante AND osi.IdOrdemServico = mp.IdOrdemServico AND (osi.D_E_L_E_T_E IS NULL OR osi.D_E_L_E_T_E = '')
        LEFT JOIN material m ON m.CodMatFabricante = mp.codmatFabricante
    `;
    
    try {
        const [rows] = await c.query(query, [1]);
        console.log("Rows returned:", rows.length);
        if(rows.length > 0) {
            console.log("First row CodMatFabricante:", rows[0].CodMatFabricante);
        }
    } catch(e) {
        console.error("Error executing query:", e);
    }
    
    process.exit(0);
}

test();

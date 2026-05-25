const mysql = require('mysql2/promise');
require('dotenv').config({path: '.env'});

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    
    try {
        const query = `
            SELECT 
                p.IdProjeto, 
                p.Projeto, 
                COUNT(t.IdTag) as TotalTags,
                SUM(CASE WHEN t.realizadoFinalExpedicao IS NULL OR TRIM(t.realizadoFinalExpedicao) = '' THEN 1 ELSE 0 END) as FaltaExpedicao
            FROM projetos p
            LEFT JOIN tags t ON t.IdProjeto = p.IdProjeto AND (t.D_E_L_E_T_E IS NULL OR t.D_E_L_E_T_E = '')
            WHERE (p.D_E_L_E_T_E IS NULL OR p.D_E_L_E_T_E = '')
            GROUP BY p.IdProjeto
            ORDER BY p.IdProjeto DESC
            LIMIT 5
        `;
        const [rows] = await conn.execute(query);
        console.log("Success! Rows:", rows);
    } catch(err) {
        console.error("SQL Error:", err.message);
    }
    await conn.end();
})();

require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await pool.query(`
            SELECT
                v.idordemservicoitemControle,
                v.CriadoPor,
                v.DataCriacao,
                v.Codmatfabricante,
                v.QtdeTotal,
                v.QtdeProduzida,
                v.QtdeFaltante,
                c.Processo
            FROM viewordemservicoitemcontrole v
            LEFT JOIN ordemservicoitemcontrole c ON v.idordemservicoitemControle = c.IdOrdemServicoItemControle
            WHERE v.IdOrdemServicoItem = 1
        `);
        console.log("Rows:", rows);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
test();

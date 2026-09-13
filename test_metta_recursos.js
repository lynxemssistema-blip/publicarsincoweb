const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    try {
        const pool = mysql.createPool({ 
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'metta' 
        });
        const [rows] = await pool.execute("SELECT IdProcessoFabricacao, processofabricacao, Fabrica FROM processofabricacao WHERE (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = '')");
        console.log('Metta - Total Processos:', rows.length);
        console.log('Valores de Fabrica únicos:', [...new Set(rows.map(r => r.Fabrica))]);
        const fabricaValidos = rows.filter(r => {
            const v = r.Fabrica;
            if (!v && v !== 0) return false;
            const s = String(v).trim().toUpperCase();
            return s === 'SIM' || s === 'S' || s === '1' || s === 'TRUE' || s === 'YES' || s === 'Y';
        });
        console.log('Processos validos:', fabricaValidos.map(r => r.processofabricacao).join(', '));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
test();

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function check() {
    try {
        const pool = mysql.createPool({
            host: process.env.CENTRAL_DB_HOST || 'lynxlocal.mysql.uhserver.com',
            user: process.env.CENTRAL_DB_USER || 'lynxlocal_root',
            password: process.env.CENTRAL_DB_PASS || 'lynx@2022',
            database: 'amceletrica',
            port: 3306
        });
        
        const query = "UPDATE processofabricacao SET processofabricacao = ?, CodigoProcessoFabricacao = ?, Fabrica = ?, DataLiberada = ? WHERE IdProcessoFabricacao = ?";
        const params = ['CORTE', '', 'SIM', 'NAO', 1]; // Guessing ID 1 for Corte, doesn't matter, we just want to see if syntax fails.
        const [result] = await pool.execute(query, params);
        console.log('Update result:', result);

        pool.end();
    } catch(e) { console.error('SQL Error:', e); }
}
check();

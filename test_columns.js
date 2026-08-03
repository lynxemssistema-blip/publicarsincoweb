const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCols() {
    try {
        const pool = mysql.createPool({
            host: process.env.CENTRAL_DB_HOST || 'lynxlocal.mysql.uhserver.com',
            user: process.env.CENTRAL_DB_USER || 'lynxlocal_root',
            password: process.env.CENTRAL_DB_PASS || 'lynx@2022',
            database: 'amceletrica'
        });
        
        const [rows] = await pool.query('SHOW COLUMNS FROM ordemservico');
        const cols = rows.map(r => r.Field);
        console.log("Columns:", cols.filter(c => c.toLowerCase().includes('laser')));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkCols();

const db = require('./src/config/db');

async function checkCols() {
    try {
        db.initPool({
            host: process.env.CENTRAL_DB_HOST || 'lynxlocal.mysql.uhserver.com',
            user: process.env.CENTRAL_DB_USER || 'lynxlocal_root',
            password: process.env.CENTRAL_DB_PASS || 'lynx@2022',
            database: process.env.CENTRAL_DB_NAME || 'lynxlocal',
        });
        
        const [dbs] = await db.executeOnDefault('SELECT * FROM conexoes_bancos WHERE db_name = "amceletrica"');
        const connInfo = dbs[0];
        
        const mysql = require('mysql2/promise');
        const poolTenant = mysql.createPool({ host: connInfo.db_host, user: connInfo.db_user, password: connInfo.db_pass, database: connInfo.db_name });
        
        const [rows] = await poolTenant.query('SHOW COLUMNS FROM ordemservico');
        const cols = rows.map(r => r.Field);
        console.log("Columns:", cols.filter(c => c.toLowerCase().includes('laser')));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkCols();

const mysql = require('mysql2/promise');
const dbConfig = {
    host: 'lynxlocal.mysql.uhserver.com',
    user: 'lynxlocal',
    password: 'jHAzhFG848@yN@U',
    database: 'lynxlocal'
};

async function run() {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(`DESCRIBE material_processo;`);
    console.table(rows);
    await conn.end();
}
run().catch(console.error);

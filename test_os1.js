const mysql = require('mysql2/promise');

async function test() {
    const conn = await mysql.createConnection({
        host: '127.0.0.1', user: 'root', password: '', database: 'sinco'
    });
    const [rows] = await conn.execute("SELECT * FROM material_processo WHERE IdOrdemServico = 1");
    console.log(rows.length + ' processes for OS 1');
    if (rows.length > 0) {
        console.log(rows[0]);
    }
    await conn.end();
}
test();

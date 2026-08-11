require('dotenv').config();
const mysql = require('mysql2/promise');
async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    try {
        const [rows] = await conn.execute("SHOW TABLES LIKE 'matriz'");
        console.log("Tables:", rows);
        const [mRows] = await conn.execute("SELECT * FROM matriz LIMIT 1");
        console.log("Matriz:", mRows);
    } catch (e) {
        console.error(e);
    }
    conn.end();
}
run();

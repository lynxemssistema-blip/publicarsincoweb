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
        const [rows] = await conn.execute("SELECT * FROM material_processo WHERE codmatFabricante = 'MT-013'");
        console.log("material_processo MT-013:", rows);
    } catch (e) {
        console.error(e);
    }
    conn.end();
}
run();

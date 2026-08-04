const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'Opet#2021',
        database: 'lynxlocal'
    });
    
    try {
        await pool.query("ALTER TABLE producaorecursodiario ADD COLUMN visivel VARCHAR(3) DEFAULT 'SIM';");
        console.log("Column 'visivel' added successfully.");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column 'visivel' already exists.");
        } else {
            console.error(e);
        }
    }
    
    process.exit(0);
}

run();

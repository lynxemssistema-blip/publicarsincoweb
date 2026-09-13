const mysql = require('mysql2/promise');
require('dotenv').config();
(async () => {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'lynxlocal'
  });
  const [rows] = await pool.execute(
    "SELECT IdTag, Tag, DataEntrada, DataPrevisao, CriadoPor FROM tags WHERE (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = '') LIMIT 5"
  );
  console.table(rows);
  await pool.end();
})();

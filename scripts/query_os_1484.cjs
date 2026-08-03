const db = require('../src/config/db.js');
const mysql = require('mysql2/promise');

async function test() {
  try {
    const [tenants] = await db.executeOnDefault('SELECT * FROM conexoes_bancos WHERE ativo = 1 AND db_name = "amceletrica"');
    const tenantRow = tenants[0];
    const pool = mysql.createPool({
        host: tenantRow.db_host,
        user: tenantRow.db_user,
        password: tenantRow.db_pass,
        database: tenantRow.db_name,
        port: tenantRow.db_port || 3306
    });
    
    console.log("Checking ordemservicoitem columns...");
    const [cols] = await pool.execute("SHOW COLUMNS FROM ordemservicoitem");
    console.log(cols.map(c => c.Field));
    
    console.log("\nChecking data for OS 1484...");
    const [items] = await pool.execute("SELECT IDOrdemServicoITEM, IDOrdemServico, DescResumo, QtdeTotal FROM ordemservicoitem WHERE IDOrdemServico = 1484").catch(e => [[{error: e.message}]]);
    console.log(items);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
test();

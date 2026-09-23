const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
async function run() {
  const pool = await mysql.createPool({ host: process.env.CENTRAL_DB_HOST, user: process.env.CENTRAL_DB_USER, password: process.env.CENTRAL_DB_PASS, database: process.env.CENTRAL_DB_NAME });
  const conn = await pool.getConnection();
  try {
    console.log('=== montapeca chain ===');
    const [r1] = await conn.execute("SELECT CodMatFabricante, CodMatFabricantePeca, PecaQtde FROM montapeca WHERE CodMatFabricante = 'MT-0017'");
    console.log('MT-0017 filhos:', JSON.stringify(r1));
    const [r2] = await conn.execute("SELECT CodMatFabricante, CodMatFabricantePeca, PecaQtde FROM montapeca WHERE CodMatFabricante = 'MT-0015'");
    console.log('MT-0015 filhos:', JSON.stringify(r2));
    const [r3] = await conn.execute("SELECT CodMatFabricante, CodMatFabricantePeca, PecaQtde FROM montapeca WHERE CodMatFabricante = 'MT-007'");
    console.log('MT-007 filhos:', JSON.stringify(r3));

    console.log('\n=== material_processo para 11-010-007-CP-1354 ===');
    const [mp] = await conn.execute("SELECT IdMaterialProcesso, IdOrdemServico, IdProcesso, SequenciaExecucao, TotalExecutar FROM material_processo WHERE codmatFabricante = '11-010-007-CP-1354' ORDER BY IdOrdemServico, SequenciaExecucao");
    mp.forEach(r => console.log(JSON.stringify(r)));

    console.log('\n=== ordemservicoitem OS 7 ===');
    const [osi] = await conn.execute('SELECT IdOrdemServicoItem, CodMatFabricante, QtdeTotal FROM ordemservicoitem WHERE IdOrdemServico = 7');
    osi.forEach(r => console.log(JSON.stringify(r)));

    // Ver qual campo CodMatFabricantePeca existe vs CodMatFabricante - talvez a query usa col errada
    console.log('\n=== montapeca row para MT-007 CodMatFabricantePeca=11-010-007-CP-1354 ===');
    const [r4] = await conn.execute("SELECT * FROM montapeca WHERE CodMatFabricantePeca = '11-010-007-CP-1354'");
    r4.forEach(r => console.log(JSON.stringify(r)));
  } finally { conn.release(); await pool.end(); }
}
run().catch(console.error);

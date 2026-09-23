const mysql = require('mysql2/promise');
const path  = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
async function run() {
  const pool = await mysql.createPool({ host: process.env.CENTRAL_DB_HOST, user: process.env.CENTRAL_DB_USER, password: process.env.CENTRAL_DB_PASS, database: process.env.CENTRAL_DB_NAME, port: 3306 });
  const conn = await pool.getConnection();
  try {
    // Estado atual dos registros material_processo para 04470600VA / OS 5
    const [mp] = await conn.execute(`
      SELECT mp.IdMaterialProcesso, mp.IdProcesso, pf.processofabricacao,
             mp.SequenciaExecucao, mp.TotalExecutar, mp.TotalExecutado, mp.IdOrdemServico
      FROM material_processo mp
      LEFT JOIN processofabricacao pf ON pf.IdProcessoFabricacao = mp.IdProcesso
      WHERE mp.codmatFabricante = '04470600VA' AND mp.IdOrdemServico = 5
      ORDER BY mp.SequenciaExecucao ASC
    `);
    console.log('material_processo OS5 / 04470600VA:');
    mp.forEach(r => console.log('  ', JSON.stringify(r)));

    // ordemservicoitem para conferir QtdeTotal
    const [osi] = await conn.execute("SELECT IdOrdemServicoItem, CodMatFabricante, QtdeTotal FROM ordemservicoitem WHERE IdOrdemServico=5 AND CodMatFabricante='04470600VA'");
    console.log('\nordemservicoitem:');
    osi.forEach(r => console.log('  ', JSON.stringify(r)));

    // Templates (sem OS) — sequência correta
    const [tmpl] = await conn.execute(`
      SELECT mp.IdMaterialProcesso, mp.IdProcesso, pf.processofabricacao, mp.SequenciaExecucao, mp.TotalExecutar
      FROM material_processo mp
      LEFT JOIN processofabricacao pf ON pf.IdProcessoFabricacao = mp.IdProcesso
      WHERE mp.codmatFabricante = '04470600VA' AND (mp.IdOrdemServico IS NULL OR mp.IdOrdemServico = 0)
      ORDER BY mp.SequenciaExecucao ASC
    `);
    console.log('\nTemplates (sequência correta):');
    tmpl.forEach(r => console.log('  ', JSON.stringify(r)));
  } finally { conn.release(); await pool.end(); }
}
run().catch(console.error);

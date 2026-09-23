/**
 * inspect_e_fix_os5.js
 * Diagnóstico completo + correção para o item raiz da OS
 */
const mysql = require('mysql2/promise');
const path  = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
  const pool = await mysql.createPool({
    host: process.env.CENTRAL_DB_HOST, user: process.env.CENTRAL_DB_USER,
    password: process.env.CENTRAL_DB_PASS, database: process.env.CENTRAL_DB_NAME, port: 3306
  });
  const conn = await pool.getConnection();
  try {
    // --- ordemservicoitem OS 5 ---
    const [osi] = await conn.execute(
      'SELECT IdOrdemServicoItem, CodMatFabricante, QtdeTotal, Liberado_Engenharia FROM ordemservicoitem WHERE IdOrdemServico = 5 ORDER BY IdOrdemServicoItem'
    );
    console.log('ordemservicoitem OS 5:');
    osi.forEach(r => console.log(' ', JSON.stringify(r)));

    // --- material_processo para 04470600VA em todas as OS ---
    const [mp] = await conn.execute(
      "SELECT IdMaterialProcesso, IdOrdemServico, IdProcesso, SequenciaExecucao, TotalExecutar, TotalExecutado FROM material_processo WHERE codmatFabricante = '04470600VA' ORDER BY IdOrdemServico, SequenciaExecucao"
    );
    console.log('\nmaterial_processo 04470600VA (todas as OS):');
    mp.forEach(r => console.log(' ', JSON.stringify(r)));

    // --- templates (sem OS) ---
    const [tmpl] = await conn.execute(
      "SELECT mp.IdMaterialProcesso, mp.IdProcesso, mp.SequenciaExecucao, mp.TotalExecutar, mp.TempoEstimadoMin, mp.TempoPadraoMin, pf.processofabricacao FROM material_processo mp LEFT JOIN processofabricacao pf ON pf.IdProcessoFabricacao = mp.IdProcesso WHERE mp.codmatFabricante = '04470600VA' AND (mp.IdOrdemServico IS NULL OR mp.IdOrdemServico = 0) ORDER BY mp.SequenciaExecucao"
    );
    console.log('\nTemplates (sem OS):');
    tmpl.forEach(r => console.log(' ', JSON.stringify(r)));

    // --- OS 5 info ---
    const [[os]] = await conn.execute('SELECT * FROM ordemservico WHERE IdOrdemServico = 5 LIMIT 1');
    console.log('\nOS 5:', JSON.stringify({ IdProjeto: os.IdProjeto, IdTag: os.IdTag, Projeto: os.Projeto, Tag: os.Tag }));
  } finally { conn.release(); await pool.end(); }
}
run().catch(console.error);

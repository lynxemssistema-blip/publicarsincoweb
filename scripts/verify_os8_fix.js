const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verify() {
  const pool = await mysql.createPool({
    host: process.env.CENTRAL_DB_HOST,
    user: process.env.CENTRAL_DB_USER,
    password: process.env.CENTRAL_DB_PASS,
    database: process.env.CENTRAL_DB_NAME,
    port: 3306, connectTimeout: 30000
  });
  const conn = await pool.getConnection();
  try {
    console.log('=== VERIFICACAO POS-CORRECAO ===\n');

    console.log('--- 1. ordemservicoitem OS 8 ---');
    const [r1] = await conn.execute(
      'SELECT IdOrdemServicoItem, codmatFabricante, QtdeTotal, Liberado_Engenharia FROM ordemservicoitem WHERE IdOrdemServico = 8 ORDER BY IdOrdemServicoItem'
    );
    console.log('Total itens:', r1.length);
    r1.forEach(r => console.log('  -', r.codmatFabricante, '| Qt:', r.QtdeTotal, '| Lib:', r.Liberado_Engenharia));

    console.log('\n--- 2. material_processo OS 8 ---');
    const [r2] = await conn.execute(`
      SELECT mp.codmatFabricante, pf.processofabricacao, mp.TotalExecutar, mp.TotalExecutado, mp.SequenciaExecucao 
      FROM material_processo mp 
      LEFT JOIN processofabricacao pf ON pf.IdProcessoFabricacao = mp.IdProcesso 
      WHERE mp.IdOrdemServico = 8 
      ORDER BY mp.codmatFabricante, mp.SequenciaExecucao
    `);
    console.log('Total registros:', r2.length);
    r2.forEach(r => console.log('  -', r.codmatFabricante, '|', r.processofabricacao, '| Seq:', r.SequenciaExecucao, '| TotalExec:', r.TotalExecutar));

    console.log('\n--- 3. Simulando query Tela 1 (DOBRA = IdProcesso 2, OS 8) ---');
    const [r3] = await conn.execute(`
      SELECT mp.codmatFabricante, 
             COALESCE(osi.DescResumo, mp.codmatFabricante) AS DescResumo,
             pf.processofabricacao, 
             mp.TotalExecutar,
             osi.IdOrdemServicoItem, 
             COALESCE(osi.Liberado_Engenharia,'N') AS Liberado
      FROM material_processo mp
      LEFT JOIN ordemservicoitem osi 
        ON osi.IdOrdemServico = mp.IdOrdemServico 
       AND osi.codmatFabricante = mp.codmatFabricante
      JOIN ordemservico os ON os.IdOrdemServico = mp.IdOrdemServico
      LEFT JOIN processofabricacao pf ON pf.IdProcessoFabricacao = mp.IdProcesso
      WHERE mp.IdOrdemServico = 8 
        AND mp.IdProcesso = 2
        AND mp.IdOrdemServico IS NOT NULL 
        AND mp.IdOrdemServico > 0
        AND (osi.Liberado_Engenharia = 'S' OR osi.IdOrdemServicoItem IS NULL)
    `);
    console.log('Itens com DOBRA na OS 8:', r3.length);
    r3.forEach(r => console.log('  -', r.codmatFabricante, '|', r.DescResumo, '| Proc:', r.processofabricacao, '| OSI:', r.IdOrdemServicoItem, '| Lib:', r.Liberado));

    console.log('\n--- 4. Simulando query Tela 1 (GALVANIZAR = IdProcesso 18, OS 8) ---');
    const [r4] = await conn.execute(`
      SELECT mp.codmatFabricante, 
             COALESCE(osi.DescResumo, mp.codmatFabricante) AS DescResumo, 
             mp.TotalExecutar
      FROM material_processo mp
      LEFT JOIN ordemservicoitem osi 
        ON osi.IdOrdemServico = mp.IdOrdemServico 
       AND osi.codmatFabricante = mp.codmatFabricante
      JOIN ordemservico os ON os.IdOrdemServico = mp.IdOrdemServico
      WHERE mp.IdOrdemServico = 8 
        AND mp.IdProcesso = 18
        AND (osi.Liberado_Engenharia = 'S' OR osi.IdOrdemServicoItem IS NULL)
    `);
    console.log('Itens com GALVANIZAR na OS 8:', r4.length);
    r4.forEach(r => console.log('  -', r.codmatFabricante, '|', r.DescResumo));

  } finally {
    conn.release();
    await pool.end();
  }
}

verify().catch(e => { console.error('ERRO:', e.message); process.exit(1); });

/**
 * Verifica e reporta o estado de cascata em todas as OS.
 * Mostra apenas itens com múltiplos processos Fabrica=SIM para auditoria visual.
 */
const mysql = require('mysql2/promise');
const path  = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verificar() {
  const pool = await mysql.createPool({
    host: process.env.CENTRAL_DB_HOST, user: process.env.CENTRAL_DB_USER,
    password: process.env.CENTRAL_DB_PASS, database: process.env.CENTRAL_DB_NAME,
    port: 3306, waitForConnections: true, connectionLimit: 3
  });
  const conn = await pool.getConnection();

  try {
    const [rows] = await conn.execute(`
      SELECT mp.IdOrdemServico, mp.codmatFabricante,
             pf.processofabricacao, pf.Fabrica,
             mp.SequenciaExecucao, mp.TotalExecutar, mp.TotalExecutado,
             osi.QtdeTotal
      FROM material_processo mp
      LEFT JOIN processofabricacao pf ON pf.IdProcessoFabricacao = mp.IdProcesso
      LEFT JOIN ordemservicoitem osi
             ON osi.IdOrdemServico = mp.IdOrdemServico
            AND osi.codmatFabricante = mp.codmatFabricante
      WHERE mp.IdOrdemServico IS NOT NULL AND mp.IdOrdemServico > 0
      ORDER BY mp.IdOrdemServico, mp.codmatFabricante, mp.SequenciaExecucao
    `);

    // Agrupar por (OS + item)
    const grupos = {};
    for (const r of rows) {
      const key = `${r.IdOrdemServico}|${r.codmatFabricante}`;
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(r);
    }

    let erros = 0;
    let ok = 0;

    console.log('\n=== AUDITORIA DE CASCATA — TODAS AS OS ===\n');

    for (const [key, processos] of Object.entries(grupos)) {
      const [osId, cod] = key.split('|');
      const fabSIM = processos.filter(p => {
        const f = (p.Fabrica || '').toUpperCase().replace(/[^A-Z]/g,'');
        return f === 'SIM';
      });

      if (fabSIM.length < 2) continue; // Só mostra itens com múltiplos Fabrica=SIM

      // Verificar regra: apenas o 1º Fabrica=SIM pode ter TotalExecutar > 0
      let temErro = false;
      for (let i = 1; i < fabSIM.length; i++) {
        if (Number(fabSIM[i].TotalExecutar) > 0) {
          temErro = true;
          break;
        }
      }

      if (temErro) {
        erros++;
        console.log(`❌ OS ${osId} | ${cod}`);
      } else {
        ok++;
        console.log(`✅ OS ${osId} | ${cod}`);
      }

      fabSIM.forEach((p, i) => {
        const label = i === 0 ? '🟢 1º' : (Number(p.TotalExecutar) > 0 ? '❌' : '⏸️ ');
        console.log(`   ${label} Seq=${p.SequenciaExecucao} | ${p.processofabricacao} | TExec=${p.TotalExecutar} | TDone=${p.TotalExecutado ?? 'null'} | QtdeItem=${p.QtdeTotal}`);
      });
      console.log('');
    }

    console.log('='.repeat(60));
    console.log(`✅ Corretos: ${ok} | ❌ Com erro: ${erros}`);

    if (erros > 0) {
      console.log('\n⚠️  Execute: node scripts/fix_cascata_fabrica_sim.js para corrigir\n');
    } else {
      console.log('\n🎉 Todos os itens com múltiplos recursos Fabrica=SIM estão corretos!\n');
    }

  } finally {
    conn.release();
    await pool.end();
  }
}

verificar().catch(e => { console.error('FATAL:', e.message); process.exit(1); });

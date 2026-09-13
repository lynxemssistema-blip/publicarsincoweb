const mysql = require('mysql2/promise');
require('dotenv').config();

async function backfill() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'lynxlocal.mysql.uhserver.com',
    user: process.env.DB_USER || 'lynxlocal',
    password: process.env.DB_PASSWORD,
    database: 'lynxlocal',
    waitForConnections: true
  });

  const hoje = new Date().toLocaleDateString('pt-BR');
  console.log('Data atual para fallback:', hoje);

  // Atualiza DataEntrada nas tags que tem NULL
  const sql1 = `
    UPDATE tags t
    LEFT JOIN projetos p ON p.IdProjeto = t.IdProjeto
    SET t.DataEntrada = COALESCE(
      NULLIF(TRIM(p.DataEntradaPedido), ''),
      CASE WHEN t.DataPrevisao IS NOT NULL AND TRIM(t.DataPrevisao) != '' 
           THEN t.DataPrevisao 
           ELSE NULL END,
      ?
    )
    WHERE (t.DataEntrada IS NULL OR TRIM(t.DataEntrada) = '')
      AND (t.D_E_L_E_T_E IS NULL OR t.D_E_L_E_T_E = '')
  `;
  const [r1] = await pool.execute(sql1, [hoje]);
  console.log('DataEntrada atualizada em', r1.affectedRows, 'tag(s)');

  // Atualiza CriadoPor nas tags que tem NULL
  const sql2 = `
    UPDATE tags SET CriadoPor = 'Sistema'
    WHERE (CriadoPor IS NULL OR TRIM(CriadoPor) = '')
      AND (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = '')
  `;
  const [r2] = await pool.execute(sql2);
  console.log('CriadoPor atualizado em', r2.affectedRows, 'tag(s)');

  await pool.end();
  console.log('Concluido!');
}

backfill().catch(console.error);

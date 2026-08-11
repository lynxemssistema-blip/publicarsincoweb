const mysql = require('mysql2/promise');
async function r() {
  const c = await mysql.createConnection({
    host: 'lynxlocal.mysql.uhserver.com',
    user: 'lynxlocal',
    password: 'jHAzhFG848@yN@U',
    database: 'lynxlocal'
  });
  const [rows] = await c.query("SELECT IdOrdemServico FROM ordemservico WHERE (D_E_L_E_T_E IS NULL OR D_E_L_E_T_E = '') AND (OrdemServicoFinalizado IS NULL OR OrdemServicoFinalizado != 'C') AND (Liberado_Engenharia IS NULL OR Liberado_Engenharia != 'S') LIMIT 50");
  console.log(rows.length, 'rows');
  c.end();
}
r();

const m = require('mysql2/promise');
require('dotenv').config();
m.createPool({host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME})
.query('SELECT os.IdOrdemServico, os.Estatus as StatusOS, os.OrdemServicoFinalizado as OSFinalizado, p.Finalizado as StatusProjeto FROM ordemservicoitemcontrole c INNER JOIN ordemservicoitem i ON c.IdOrdemServicoItem = i.IdOrdemServicoItem INNER JOIN ordemservico os ON c.IdOrdemServico = os.IdOrdemServico LEFT JOIN projetos p ON os.Projeto = p.Projeto WHERE c.TipoApontamento = "Parcial" LIMIT 5')
.then(r => {console.log(r[0]); process.exit(0)});
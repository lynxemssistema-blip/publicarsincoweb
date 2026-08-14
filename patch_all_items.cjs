const fs = require('fs');

const file = 'src/routes/relatorioOs.js';
let content = fs.readFileSync(file, 'utf8');

const oldQuery = `SELECT i.IdOrdemServicoItem, i.IdMaterial, i.CodDesenhoProduto, i.DescricaoProduto, i.Qtde, i.Fator, i.PesoTotal,`;
const newQuery = `SELECT i.IdOrdemServicoItem, i.IdMaterial, i.CodMatFabricante as CodDesenhoProduto, i.DescResumo as DescricaoProduto, i.qtde as Qtde, i.Fator, i.Peso as PesoTotal,`;

// Split by oldQuery and join with newQuery to replace all occurrences
content = content.split(oldQuery).join(newQuery);

fs.writeFileSync(file, content, 'utf8');
console.log('Success: relatorioOs.js ALL ITEMS queries patched');

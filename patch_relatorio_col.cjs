const fs = require('fs');

const file = 'src/routes/relatorioOs.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/o\.DataEmissao/g, 'o.DataCriacao');

fs.writeFileSync(file, content, 'utf8');
console.log('Success: relatorioOs.js patched DataEmissao -> DataCriacao');

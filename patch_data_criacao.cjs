const fs = require('fs');

const file = 'src/routes/relatorioOs.js';
let content = fs.readFileSync(file, 'utf8');

// Replace os.DataEmissao with os.DataCriacao
content = content.replace(/os\.DataEmissao/g, 'os.DataCriacao');

fs.writeFileSync(file, content, 'utf8');
console.log('Success: relatorioOs.js DataCriacao mapped correctly in UI blocks');

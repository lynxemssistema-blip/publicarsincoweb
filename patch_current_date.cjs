const fs = require('fs');

const file = 'src/routes/relatorioOs.js';
let content = fs.readFileSync(file, 'utf8');

// The previous patch changed os.DataEmissao to os.DataCriacao inside formatBR(...)
// Now the user wants the system date, so we change formatBR(os.DataCriacao) to formatBR(new Date())
content = content.replace(/formatBR\(os\.DataCriacao\)/g, 'formatBR(new Date())');

fs.writeFileSync(file, content, 'utf8');
console.log('Success: relatorioOs.js data de emissao set to current date');

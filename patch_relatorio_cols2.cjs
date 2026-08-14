const fs = require('fs');
const file = 'src/routes/relatorioOs.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/t\.Descricao as TagDescricao/g, 't.DescTag as TagDescricao');
content = content.replace(/p\.Descricao as ProjetoDescricao/g, 'p.DescProjeto as ProjetoDescricao');

fs.writeFileSync(file, content, 'utf8');
console.log('Success: relatorioOs.js columns patched');

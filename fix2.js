const fs = require('fs');
let s = fs.readFileSync('src/server.js', 'utf8');
s = s.replace(/REPLACE\(LOWER\(Descricao\), \\' \\', \\'\\'\)/g, "REPLACE(LOWER(Descricao), ' ', '')");
fs.writeFileSync('src/server.js', s);
console.log('Fixed syntax error');

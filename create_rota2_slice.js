const fs = require('fs');
const lines = fs.readFileSync('scripts/add_rota2.js', 'utf8').split('\n');
let routeCode = lines.slice(8, 199).join('\n');
routeCode = routeCode.replace(/\\`/g, '`');
routeCode = routeCode.replace(/\\\$/g, '$');
routeCode = routeCode.replace("REPLACE(LOWER(Descricao), \\' \\', \\'\\')", "REPLACE(LOWER(Descricao), ' ', '')");
let mod = 'module.exports = function(app, tenantMiddleware) {\n' + routeCode + '\n};\n';
fs.writeFileSync('src/routes/rota2.js', mod);
console.log('Created src/routes/rota2.js cleanly');

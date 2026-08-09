const fs = require('fs');
let r = fs.readFileSync('scripts/add_rota2.js', 'utf8');
let routeCode = r.split('const getRoute = `')[1].split('`;')[0];
routeCode = routeCode.replace(/\\`/g, '`').replace(/\\\$/g, '$').replace("REPLACE(LOWER(Descricao), \\' \\', \\'\\')", "REPLACE(LOWER(Descricao), ' ', '')");
let mod = 'module.exports = function(app, tenantMiddleware) {\n' + routeCode + '\n};\n';
fs.writeFileSync('src/routes/rota2.js', mod);
console.log('Created src/routes/rota2.js');

const fs = require('fs');
let r = fs.readFileSync('scripts/add_rota2.js', 'utf8');

// The file contains `const getRoute = \`...\`;`
// Let's execute it to get the unescaped string!
let sandbox = {};
let code = r.substring(0, r.indexOf('if (!content.includes'));
eval(code + '\n sandbox.getRoute = getRoute;');

let routeCode = sandbox.getRoute;
routeCode = routeCode.replace("REPLACE(LOWER(Descricao), \\' \\', \\'\\')", "REPLACE(LOWER(Descricao), ' ', '')");

let mod = 'module.exports = function(app, tenantMiddleware) {\n' + routeCode + '\n};\n';
fs.writeFileSync('src/routes/rota2.js', mod);
console.log('Created src/routes/rota2.js properly');

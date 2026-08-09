const fs = require('fs');
let s = fs.readFileSync('src/server.js', 'utf8');
let r = fs.readFileSync('scripts/add_rota2.js', 'utf8');
let routeCode = r.split('const getRoute = `')[1].split('`;')[0];
s = s.replace("app.get('/api/apontamento/mapa/producao'", routeCode + "\n\napp.get('/api/apontamento/mapa/producao'");
fs.writeFileSync('src/server.js', s);
console.log('Injected routes into server.js');
